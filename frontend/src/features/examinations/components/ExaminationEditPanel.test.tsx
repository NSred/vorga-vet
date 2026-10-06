import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { ApiError } from '@/shared/lib/apiClient'
import * as examinationsApi from '../api/examinationsApi'
import type { CostSlot, DiagnosisFieldProps, Examination } from '../types'
import { ExaminationEditPanel } from './ExaminationEditPanel'

const examination: Examination = {
  id: 'e1',
  patientId: 'p1',
  appointmentId: 'a1',
  performedByFirstName: 'Mira',
  performedByLastName: 'Vet',
  startedAt: '2026-09-17T07:00:00Z',
  anamnesis: 'scratching',
  diagnosis: 'otitis',
  cost: 45.5,
  isPaid: false,
  createdAt: '2026-09-17T07:30:00Z',
  attachments: [],
}

function fakeDiagnosis({ value, onChange, error }: DiagnosisFieldProps) {
  return (
    <>
      <input
        aria-label="Diagnosis"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && <p>{error}</p>}
    </>
  )
}

function costSlot(overrides: Partial<CostSlot> = {}): CostSlot {
  return {
    section: <p>charges</p>,
    total: 3200,
    validate: vi.fn(() => true),
    commit: vi.fn(() => Promise.resolve()),
    ...overrides,
  }
}

function renderPanel(slot: CostSlot = costSlot()) {
  const props = { onOpenChange: vi.fn(), onSaved: vi.fn(), onMissing: vi.fn() }
  render(
    <ExaminationEditPanel
      examination={examination}
      costSlot={slot}
      renderDiagnosis={fakeDiagnosis}
      open
      {...props}
    />,
  )

  return { ...props, slot }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ExaminationEditPanel', () => {
  it('prefills every field from the examination', () => {
    renderPanel()

    expect((screen.getByLabelText('Performed by, first name *') as HTMLInputElement).value).toBe(
      'Mira',
    )
    expect((screen.getByLabelText('Anamnesis') as HTMLTextAreaElement).value).toBe('scratching')
    expect((screen.getByLabelText('Diagnosis') as HTMLTextAreaElement).value).toBe('otitis')
    expect(screen.getByText('charges')).toBeInTheDocument()
  })

  it('shows the visit date in the header', () => {
    renderPanel()

    expect(screen.getByText('17.09.2026 · 09:00')).toBeInTheDocument()
  })

  it('puts the edited details and reports success', async () => {
    const updateSpy = vi.spyOn(examinationsApi, 'updateExamination').mockResolvedValue(undefined)
    const user = userEvent.setup()
    const props = renderPanel()

    await user.clear(screen.getByLabelText('Diagnosis'))
    await user.type(screen.getByLabelText('Diagnosis'), 'otitis externa')
    await user.type(screen.getByLabelText('Therapy'), 'drops twice daily')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(updateSpy).toHaveBeenCalledWith('e1', {
        performedByFirstName: 'Mira',
        performedByLastName: 'Vet',
        anamnesis: 'scratching',
        diagnosis: 'otitis externa',
        therapy: 'drops twice daily',
        cost: 3200,
      }),
    )
    await waitFor(() => expect(props.onSaved).toHaveBeenCalled())
    expect(props.slot.commit).toHaveBeenCalledWith({
      id: 'e1',
      patientId: 'p1',
      startedAt: '2026-09-17T07:00:00Z',
    })
  })

  it('hands a vanished examination to the caller', async () => {
    vi.spyOn(examinationsApi, 'updateExamination').mockRejectedValue(
      new ApiError(404, 'gone', 'Examinations.NotFound'),
    )
    const user = userEvent.setup()
    const props = renderPanel()

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(props.onMissing).toHaveBeenCalledWith('That examination no longer exists.'),
    )
    expect(props.onSaved).not.toHaveBeenCalled()
    expect(props.slot.commit).not.toHaveBeenCalled()
  })

  it('does not save while the charges are invalid', async () => {
    const updateSpy = vi.spyOn(examinationsApi, 'updateExamination').mockResolvedValue(undefined)
    const user = userEvent.setup()
    const props = renderPanel(costSlot({ validate: vi.fn(() => false) }))

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(props.slot.validate).toHaveBeenCalled()
    expect(updateSpy).not.toHaveBeenCalled()
    expect(props.onSaved).not.toHaveBeenCalled()
  })

  it('keeps the panel open and shows other failures inline', async () => {
    vi.spyOn(examinationsApi, 'updateExamination').mockRejectedValue(
      new ApiError(400, 'x', 'Validation', ["'Diagnosis' is too long."]),
    )
    const user = userEvent.setup()
    const props = renderPanel()

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText("'Diagnosis' is too long.")).toBeInTheDocument()
    expect(props.onSaved).not.toHaveBeenCalled()
  })

  it('requires the performer names', async () => {
    const updateSpy = vi.spyOn(examinationsApi, 'updateExamination').mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPanel()

    await user.clear(screen.getByLabelText('Performed by, first name *'))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('First name is required')).toBeInTheDocument()
    expect(updateSpy).not.toHaveBeenCalled()
  })
})
