import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { ApiError } from '@/shared/lib/apiClient'
import * as appointmentsApi from '../api/appointmentsApi'
import { AppointmentFormPanel, type AppointmentFormPanelProps } from './AppointmentFormPanel'
import type { Appointment, AvailabilitySlot } from '../types'

const slots: AvailabilitySlot[] = [
  {
    startsAt: '2026-09-17T05:00:00Z',
    endsAt: '2026-09-17T05:30:00Z',
    isAvailable: true,
    isMine: false,
  },
  {
    startsAt: '2026-09-17T05:30:00Z',
    endsAt: '2026-09-17T06:00:00Z',
    isAvailable: false,
    isMine: false,
  },
  {
    startsAt: '2026-09-17T06:00:00Z',
    endsAt: '2026-09-17T06:30:00Z',
    isAvailable: true,
    isMine: false,
  },
]

const scheduled: Appointment = {
  id: 'a1',
  createdByUserId: 'u1',
  ownerId: 'o1',
  patientId: 'p1',
  startsAt: '2026-09-17T05:30:00Z',
  endsAt: '2026-09-17T06:00:00Z',
  durationMinutes: 30,
  type: 'checkup',
  status: 'scheduled',
  ownerName: 'Ana Petrović',
  patientName: 'Luna',
  createdAt: '2026-09-10T10:00:00Z',
}

function renderForm(overrides: Partial<AppointmentFormPanelProps> = {}) {
  const props: AppointmentFormPanelProps = {
    mode: 'create',
    initialDate: '2026-09-17',
    open: true,
    onOpenChange: vi.fn(),
    onSaved: vi.fn(),
    ownerField: (field) => (
      <button type="button" onClick={() => field.onChange({ id: 'o1', label: 'Ana' })}>
        Owner: {field.value?.label ?? 'none'}
      </button>
    ),
    patientField: (field) => (
      <div>
        <button type="button" onClick={() => field.onChange({ id: 'p1', label: 'Luna' })}>
          Patient: {field.value?.label ?? 'none'}
        </button>
        {field.error && <p role="alert">{field.error}</p>}
      </div>
    ),
    ...overrides,
  }
  render(<AppointmentFormPanel {...props} />)

  return props
}

let availabilitySpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  availabilitySpy = vi.spyOn(appointmentsApi, 'getAvailability').mockResolvedValue(slots)
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function pickTime(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(screen.getByRole('combobox', { name: 'Start time *' }))
  await user.click(await screen.findByRole('option', { name: label }))
}

describe('AppointmentFormPanel create', () => {
  it('lists only free slots in clinic time', async () => {
    const user = userEvent.setup()
    renderForm()

    await waitFor(() => expect(availabilitySpy).toHaveBeenCalled())
    await user.click(screen.getByRole('combobox', { name: 'Start time *' }))

    expect(await screen.findByRole('option', { name: '07:00' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '08:00' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: '07:30' })).not.toBeInTheDocument()
  })

  it('submits the chosen slot with the mapped type and parties', async () => {
    const user = userEvent.setup()
    const createSpy = vi.spyOn(appointmentsApi, 'createAppointment').mockResolvedValue('a9')
    const props = renderForm()

    await pickTime(user, '07:00')
    await user.click(screen.getByRole('button', { name: /^Patient:/ }))
    await user.click(screen.getByRole('button', { name: /^Owner:/ }))
    await user.type(screen.getByLabelText('Reason'), 'limping')
    await user.click(screen.getByRole('button', { name: 'Book' }))

    await waitFor(() =>
      expect(createSpy).toHaveBeenCalledWith({
        ownerId: 'o1',
        patientId: 'p1',
        startsAt: '2026-09-17T05:00:00Z',
        durationMinutes: 30,
        type: 1,
        reason: 'limping',
      }),
    )
    expect(props.onSaved).toHaveBeenCalled()
  })

  it('shows the duration only for a surgery and requests availability for it', async () => {
    const user = userEvent.setup()
    renderForm()

    expect(screen.queryByRole('combobox', { name: 'Duration' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: 'Type' }))
    await user.click(await screen.findByRole('option', { name: 'Surgery' }))
    await user.click(screen.getByRole('combobox', { name: 'Duration' }))
    await user.click(await screen.findByRole('option', { name: '90 min' }))

    await waitFor(() => expect(availabilitySpy).toHaveBeenCalledWith(expect.anything(), 90))
  })

  it('preselects the slot it was opened with', async () => {
    renderForm({ initialStartsAt: '2026-09-17T06:00:00Z' })

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Start time *' })).toHaveTextContent('08:00'),
    )
  })

  it('marks the start time when the slot was taken meanwhile', async () => {
    const user = userEvent.setup()
    vi.spyOn(appointmentsApi, 'createAppointment').mockRejectedValue(
      new ApiError(409, 'taken', 'Appointments.SlotTaken'),
    )
    renderForm()

    await pickTime(user, '07:00')
    await user.click(screen.getByRole('button', { name: 'Book' }))

    expect(
      await screen.findByText('That time was just taken. Pick another slot.'),
    ).toBeInTheDocument()
    expect(availabilitySpy.mock.calls.length).toBeGreaterThan(1)
  })

  it('marks the patient when it belongs to another owner', async () => {
    const user = userEvent.setup()
    vi.spyOn(appointmentsApi, 'createAppointment').mockRejectedValue(
      new ApiError(400, 'mismatch', 'Appointments.PatientDoesNotBelongToOwner'),
    )
    renderForm()

    await pickTime(user, '07:00')
    await user.click(screen.getByRole('button', { name: 'Book' }))

    expect(
      await screen.findByText('This patient belongs to a different owner.'),
    ).toBeInTheDocument()
  })

  it('requires a start time', async () => {
    const user = userEvent.setup()
    const createSpy = vi.spyOn(appointmentsApi, 'createAppointment').mockResolvedValue('a9')
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Book' }))

    expect(await screen.findByText('Pick a start time')).toBeInTheDocument()
    expect(createSpy).not.toHaveBeenCalled()
  })
})

describe('AppointmentFormPanel reschedule', () => {
  it('keeps the current slot selectable and sends only the new time', async () => {
    const user = userEvent.setup()
    const rescheduleSpy = vi
      .spyOn(appointmentsApi, 'rescheduleAppointment')
      .mockResolvedValue(undefined)
    const props = renderForm({ mode: 'reschedule', appointment: scheduled })

    expect(screen.queryByRole('combobox', { name: 'Type' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Reason')).not.toBeInTheDocument()
    expect(screen.getByText('Luna')).toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: 'Start time *' }))
    expect(await screen.findByRole('option', { name: '07:30' })).toBeInTheDocument()
    await user.click(screen.getByRole('option', { name: '08:00' }))
    await user.click(screen.getByRole('button', { name: 'Move' }))

    await waitFor(() =>
      expect(rescheduleSpy).toHaveBeenCalledWith('a1', {
        startsAt: '2026-09-17T06:00:00Z',
        durationMinutes: undefined,
      }),
    )
    expect(props.onSaved).toHaveBeenCalled()
  })

  it('shows the catalog message when the appointment can no longer be moved', async () => {
    const user = userEvent.setup()
    vi.spyOn(appointmentsApi, 'rescheduleAppointment').mockRejectedValue(
      new ApiError(400, 'no', 'Appointments.OnlyScheduledCanBeRescheduled'),
    )
    renderForm({ mode: 'reschedule', appointment: scheduled })

    await pickTime(user, '08:00')
    await user.click(screen.getByRole('button', { name: 'Move' }))

    expect(
      await screen.findByText('Only an appointment that is still scheduled can be moved.'),
    ).toBeInTheDocument()
  })
})
