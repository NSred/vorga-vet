import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { addClinicDays, clinicToday } from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import {
  addManualVaccination,
  addReminder,
  listPatientReminders,
  listPatientVaccinations,
  replaceExamVaccinations,
  resetVaccinationsStore,
} from '../api/mockVaccinationsStore'
import { RemindersSection } from './RemindersSection'
import { VaccinationsSection } from './VaccinationsSection'

const today = clinicToday()

beforeEach(() => {
  resetVaccinationsStore()
})

describe('VaccinationsSection', () => {
  it('shows the next due vaccination and flags it when overdue', async () => {
    addManualVaccination('p1', {
      vaccineName: 'Vanguard Plus 7',
      isRabies: false,
      givenOn: addClinicDays(today, -400),
      dueOn: addClinicDays(today, -35),
    })
    addManualVaccination('p1', {
      vaccineName: 'Nobivac Rabies',
      isRabies: true,
      givenOn: addClinicDays(today, -10),
      dueOn: addClinicDays(today, 355),
    })

    render(<VaccinationsSection patientId="p1" />)

    expect(await screen.findByText(/Next due:/)).toHaveTextContent(
      `Next due: Vanguard Plus 7 on ${formatDisplayDate(addClinicDays(today, -35))}`,
    )
    expect(screen.getByText('Overdue')).toBeInTheDocument()
    expect(screen.getByText('Rabies')).toBeInTheDocument()
  })

  it('adds a vaccination by hand, prefilling the next due date a year later', async () => {
    const user = userEvent.setup()
    render(<VaccinationsSection patientId="p1" />)

    await user.click(await screen.findByRole('button', { name: '＋ Vaccination' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add a vaccination' })
    await user.click(within(dialog).getByRole('button', { name: 'Add vaccination' }))
    expect(await within(dialog).findByText('Name the vaccine')).toBeInTheDocument()

    await user.type(within(dialog).getByLabelText('Vaccine *'), 'Rabisin')
    await user.click(within(dialog).getByLabelText('Rabies vaccine'))
    await user.type(within(dialog).getByLabelText('Batch'), 'R-77')
    await user.click(within(dialog).getByRole('button', { name: 'Add vaccination' }))

    expect(await screen.findByText('Rabisin was added')).toBeInTheDocument()
    expect(listPatientVaccinations('p1')[0]).toMatchObject({
      vaccineName: 'Rabisin',
      isRabies: true,
      batch: 'R-77',
      givenOn: today,
      dueOn: addClinicDays(today, 365),
      source: 'manual',
    })
  })

  it('removes a hand-entered vaccination but not one from an exam', async () => {
    replaceExamVaccinations('e1', {
      patientId: 'p1',
      givenOn: today,
      lines: [
        {
          itemId: 'm1',
          vaccineName: 'Nobivac Rabies',
          isRabies: true,
          dueOn: addClinicDays(today, 365),
        },
      ],
    })
    addManualVaccination('p1', {
      vaccineName: 'Feligen CRP',
      isRabies: false,
      givenOn: addClinicDays(today, -30),
      dueOn: addClinicDays(today, 335),
    })
    const user = userEvent.setup()
    render(<VaccinationsSection patientId="p1" />)

    const list = await screen.findByRole('list', { name: 'Vaccinations' })
    expect(within(list).getAllByRole('button', { name: 'Remove' })).toHaveLength(1)
    expect(within(list).getByText(/from an exam/)).toBeInTheDocument()

    await user.click(within(list).getByRole('button', { name: 'Remove' }))
    const confirm = await screen.findByRole('dialog', { name: 'Remove Feligen CRP?' })
    await user.click(within(confirm).getByRole('button', { name: 'Remove' }))

    await waitFor(() => expect(listPatientVaccinations('p1')).toHaveLength(1))
  })
})

describe('RemindersSection', () => {
  it('adds a reminder and marks it done', async () => {
    addReminder('p1', { date: addClinicDays(today, 5), reason: 'Remind about spaying' })
    const user = userEvent.setup()
    render(<RemindersSection patientId="p1" />)

    await user.click(await screen.findByRole('button', { name: 'Mark done' }))

    await waitFor(() => expect(listPatientReminders('p1')[0].doneAt).toBeTruthy())
    expect(await screen.findByText('Done')).toBeInTheDocument()
  })

  it('asks for a reason and a date', async () => {
    const user = userEvent.setup()
    render(<RemindersSection patientId="p1" />)

    await user.click(await screen.findByRole('button', { name: '＋ Reminder' }))
    const dialog = await screen.findByRole('dialog', { name: 'Add a reminder' })
    await user.click(within(dialog).getByRole('button', { name: 'Add reminder' }))

    expect(await within(dialog).findByText('Say what to remind about')).toBeInTheDocument()
    expect(within(dialog).getByText('Pick a date')).toBeInTheDocument()
  })
})
