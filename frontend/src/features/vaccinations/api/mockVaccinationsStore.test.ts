import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/lib/apiClient'
import {
  addManualVaccination,
  addReminder,
  completeReminder,
  listDue,
  listPatientReminders,
  listPatientVaccinations,
  markContacted,
  removeVaccination,
  replaceExamVaccinations,
  resetVaccinationsStore,
  VACCINATIONS_STORAGE_KEY,
} from './mockVaccinationsStore'

const rabies = {
  vaccineName: 'Nobivac Rabies',
  itemId: 'seed-medication-01',
  isRabies: true,
}

function failure(action: () => unknown): ApiError | undefined {
  try {
    action()
  } catch (error) {
    return error as ApiError
  }
  return undefined
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-05T10:00:00Z'))
  resetVaccinationsStore()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('mock vaccinations store', () => {
  it('records a manual vaccination and lists the newest first', () => {
    addManualVaccination('p1', { ...rabies, givenOn: '2025-10-01', dueOn: '2026-10-01' })
    addManualVaccination('p1', {
      ...rabies,
      batch: ' A3KZ ',
      givenOn: '2026-10-05',
      dueOn: '2027-10-05',
    })

    const listed = listPatientVaccinations('p1')
    expect(listed.map((item) => item.givenOn)).toEqual(['2026-10-05', '2025-10-01'])
    expect(listed[0]).toMatchObject({ batch: 'A3KZ', source: 'manual', examinationId: null })
    expect(listPatientVaccinations('p2')).toEqual([])
  })

  it('validates names, batch and dates', () => {
    const error = failure(() =>
      addManualVaccination('p1', {
        vaccineName: ' ',
        isRabies: false,
        batch: 'x'.repeat(51),
        givenOn: '2026-10-06',
        dueOn: '2026-10-06',
      }),
    )

    expect(error?.code).toBe('Validation.General')
    expect(error?.validationMessages).toEqual([
      'Vaccine is required.',
      'Batch must be at most 50 characters.',
      'Given on cannot be in the future.',
      'Due on must be after given on.',
    ])
  })

  it('lists a vaccination as due until a later dose of the same vaccine replaces it', () => {
    const old = addManualVaccination('p1', {
      ...rabies,
      givenOn: '2025-10-01',
      dueOn: '2026-10-01',
    })
    addManualVaccination('p1', {
      vaccineName: 'Vanguard Plus 7',
      itemId: 'seed-medication-03',
      isRabies: false,
      givenOn: '2025-10-03',
      dueOn: '2026-10-03',
    })
    expect(listDue('2026-10-31').map((item) => item.id)).toContain(old)

    addManualVaccination('p1', { ...rabies, givenOn: '2026-10-05', dueOn: '2027-10-05' })

    expect(listDue('2026-10-31').map((item) => item.title)).toEqual(['Vanguard Plus 7'])
    expect(listDue('2027-12-31').map((item) => item.title)).toEqual([
      'Vanguard Plus 7',
      'Nobivac Rabies',
    ])
  })

  it('matches by name when a vaccination has no price list item', () => {
    addManualVaccination('p1', {
      vaccineName: 'Imported vaccine',
      isRabies: false,
      givenOn: '2025-01-01',
      dueOn: '2026-01-01',
    })
    addManualVaccination('p1', {
      vaccineName: 'imported VACCINE',
      isRabies: false,
      givenOn: '2026-01-02',
      dueOn: '2027-01-02',
    })

    expect(listDue('2026-12-31')).toEqual([])
  })

  it("replaces an exam's vaccinations instead of adding to them", () => {
    const request = {
      patientId: 'p1',
      givenOn: '2026-10-05',
      lines: [{ ...rabies, batch: 'A3KZ', dueOn: '2027-10-05' }],
    }
    replaceExamVaccinations('e1', request)
    replaceExamVaccinations('e1', request)
    expect(listPatientVaccinations('p1')).toHaveLength(1)
    expect(listPatientVaccinations('p1')[0]).toMatchObject({ source: 'exam', examinationId: 'e1' })

    replaceExamVaccinations('e1', { ...request, lines: [] })
    expect(listPatientVaccinations('p1')).toEqual([])
  })

  it('removes manual entries only', () => {
    replaceExamVaccinations('e1', {
      patientId: 'p1',
      givenOn: '2026-10-05',
      lines: [{ ...rabies, dueOn: '2027-10-05' }],
    })
    const fromExam = listPatientVaccinations('p1')[0].id
    expect(failure(() => removeVaccination(fromExam))?.code).toBe('Vaccinations.FromExam')

    const manual = addManualVaccination('p1', {
      ...rabies,
      givenOn: '2026-01-01',
      dueOn: '2027-01-01',
    })
    removeVaccination(manual)
    expect(listPatientVaccinations('p1')).toHaveLength(1)
    expect(failure(() => removeVaccination('missing'))?.code).toBe('Vaccinations.NotFound')
  })

  it('keeps a contacted vaccination due, and drops a done reminder', () => {
    const id = addManualVaccination('p1', { ...rabies, givenOn: '2025-10-01', dueOn: '2026-10-01' })
    markContacted(id)
    markContacted(id)
    expect(listDue('2026-10-31')[0].contactedAt).toBe('2026-10-05T10:00:00.000Z')

    const reminder = addReminder('p1', { date: '2026-10-10', reason: ' Remind about spaying ' })
    expect(listDue('2026-10-31').map((item) => item.kind)).toEqual(['vaccination', 'reminder'])
    completeReminder(reminder)
    completeReminder(reminder)

    expect(listDue('2026-10-31').map((item) => item.kind)).toEqual(['vaccination'])
    expect(listPatientReminders('p1')[0]).toMatchObject({ reason: 'Remind about spaying' })
  })

  it('validates reminders', () => {
    expect(
      failure(() => addReminder('p1', { date: '2026-10-04', reason: '' }))?.validationMessages,
    ).toEqual(['Reason is required.', 'Date cannot be in the past.'])
  })

  it('reads back what was saved after a reload', async () => {
    addManualVaccination('p1', { ...rabies, givenOn: '2026-10-05', dueOn: '2027-10-05' })
    expect(window.localStorage.getItem(VACCINATIONS_STORAGE_KEY)).toContain('Nobivac Rabies')

    vi.resetModules()
    const reloaded = await import('./mockVaccinationsStore')

    expect(reloaded.listPatientVaccinations('p1')).toHaveLength(1)
  })
})
