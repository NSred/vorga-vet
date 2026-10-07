import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { ApiError } from '@/shared/lib/apiClient'
import * as appointmentsApi from '../api/appointmentsApi'
import { AppointmentFormPanel, type AppointmentFormPanelProps } from './AppointmentFormPanel'
import type { Appointment, AvailabilitySlot, PartyRef } from '../types'

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
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-09-16T12:00:00Z'))
  availabilitySpy = vi.spyOn(appointmentsApi, 'getAvailability').mockResolvedValue(slots)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

async function pickTime(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(await screen.findByRole('radio', { name: label }))
}

describe('AppointmentFormPanel create', () => {
  it('offers free slots in clinic time and shows taken ones disabled', async () => {
    renderForm()

    await waitFor(() => expect(availabilitySpy).toHaveBeenCalled())

    expect(await screen.findByRole('radio', { name: '07:00' })).toBeEnabled()
    expect(screen.getByRole('radio', { name: '08:00' })).toBeEnabled()
    expect(screen.getByRole('radio', { name: '07:30, taken' })).toBeDisabled()
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

    await user.click(screen.getByRole('radio', { name: /Surgery/ }))
    await user.click(screen.getByRole('combobox', { name: 'Duration' }))
    await user.click(await screen.findByRole('option', { name: '90 min' }))

    await waitFor(() => expect(availabilitySpy).toHaveBeenCalledWith(expect.anything(), 90))
  })

  it('preselects the slot it was opened with', async () => {
    renderForm({ initialStartsAt: '2026-09-17T06:00:00Z' })

    await waitFor(() =>
      expect(screen.getByRole('radio', { name: '08:00' })).toHaveAttribute('aria-checked', 'true'),
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

    expect(screen.queryByRole('radiogroup', { name: 'Type' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Reason')).not.toBeInTheDocument()
    expect(screen.getByText('Luna')).toBeInTheDocument()

    expect(await screen.findByRole('radio', { name: '07:30' })).toBeEnabled()
    await user.click(screen.getByRole('radio', { name: '08:00' }))
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

describe('AppointmentFormPanel client variant', () => {
  it('offers no surgery and no duration', () => {
    renderForm({ variant: 'client' })

    expect(screen.queryByRole('combobox', { name: 'Duration' })).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Checkup/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /First visit/ })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: /Surgery/ })).not.toBeInTheDocument()
  })

  it('renders no owner field and no patient field unless one is given', () => {
    renderForm({ variant: 'client', ownerField: undefined, patientField: undefined })

    expect(screen.queryByRole('button', { name: /^Owner:/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Patient:/ })).not.toBeInTheDocument()
  })

  it('renders the patient field when the page supplies one', () => {
    renderForm({ variant: 'client', ownerField: undefined })

    expect(screen.getByRole('button', { name: /^Patient:/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Owner:/ })).not.toBeInTheDocument()
  })

  it('asks availability without a duration and books thirty minutes', async () => {
    const user = userEvent.setup()
    const createSpy = vi.spyOn(appointmentsApi, 'createAppointment').mockResolvedValue('a9')
    renderForm({ variant: 'client', ownerField: undefined, patientField: undefined })

    await waitFor(() => expect(availabilitySpy).toHaveBeenCalledWith(expect.anything(), undefined))

    await pickTime(user, '07:00')
    await user.click(screen.getByRole('button', { name: 'Book' }))

    await waitFor(() =>
      expect(createSpy).toHaveBeenCalledWith({
        ownerId: undefined,
        patientId: undefined,
        startsAt: '2026-09-17T05:00:00Z',
        durationMinutes: 30,
        type: 1,
        reason: undefined,
      }),
    )
  })

  it('shows a slot the client already booked as theirs and does not offer it', async () => {
    availabilitySpy.mockResolvedValue([
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
        isMine: true,
      },
    ])
    renderForm({ variant: 'client', ownerField: undefined, patientField: undefined })

    expect(await screen.findByRole('radio', { name: '07:00' })).toBeEnabled()
    expect(screen.getByRole('radio', { name: '07:30 · yours' })).toBeDisabled()
  })

  it('calls the visit a visit', () => {
    renderForm({ variant: 'client', ownerField: undefined, patientField: undefined })

    expect(screen.getByRole('dialog', { name: 'Book a visit' })).toBeInTheDocument()
  })
})

describe('AppointmentFormPanel owner from the patient', () => {
  function patientChooser(
    field: Parameters<NonNullable<AppointmentFormPanelProps['patientField']>>[0],
  ) {
    return (
      <div>
        <button type="button" onClick={() => field.onChange({ id: 'p1', label: 'Luna' })}>
          Choose Luna
        </button>
        <button type="button" onClick={() => field.onChange({ id: 'p2', label: 'Rex' })}>
          Choose Rex
        </button>
        <button type="button" onClick={() => field.onChange(null)}>
          Clear patient
        </button>
      </div>
    )
  }

  it("shows the patient's owner read-only and books with it", async () => {
    const user = userEvent.setup()
    const createSpy = vi.spyOn(appointmentsApi, 'createAppointment').mockResolvedValue('a9')
    const ownerOfPatient = vi.fn(async (patientId: string) =>
      patientId === 'p1'
        ? { id: 'o1', label: 'Ana Petrović · 062 123 456' }
        : { id: 'o2', label: 'Ivan Ilić · 063 1' },
    )
    renderForm({ patientField: patientChooser, ownerOfPatient })

    expect(screen.getByRole('button', { name: /^Owner:/ })).toBeInTheDocument()

    await pickTime(user, '07:00')
    await user.click(screen.getByRole('button', { name: 'Choose Luna' }))

    expect(await screen.findByRole('status', { name: 'Owner' })).toHaveTextContent(
      'Ana Petrović · 062 123 456',
    )
    expect(screen.queryByRole('button', { name: /^Owner:/ })).not.toBeInTheDocument()
    expect(screen.getByText("Taken from the patient's card.")).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Choose Rex' }))
    expect(await screen.findByRole('status', { name: 'Owner' })).toHaveTextContent('Ivan Ilić')

    await user.click(screen.getByRole('button', { name: 'Book' }))

    await waitFor(() =>
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: 'o2', patientId: 'p2' }),
      ),
    )
  })

  it('gives the owner field back when the patient is cleared', async () => {
    const user = userEvent.setup()
    renderForm({
      patientField: patientChooser,
      ownerOfPatient: async () => ({ id: 'o1', label: 'Ana Petrović' }),
    })

    await user.click(screen.getByRole('button', { name: 'Choose Luna' }))
    await screen.findByRole('status', { name: 'Owner' })
    await user.click(screen.getByRole('button', { name: 'Clear patient' }))

    expect(screen.queryByRole('status', { name: 'Owner' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Owner:/ })).toHaveTextContent('Owner: none')
  })

  it("keeps the later patient's owner when an earlier lookup answers late", async () => {
    const user = userEvent.setup()
    let answerLunaLookup: (owner: PartyRef) => void = () => undefined
    const ownerOfPatient = vi.fn((patientId: string) =>
      patientId === 'p1'
        ? new Promise<PartyRef>((resolve) => (answerLunaLookup = resolve))
        : Promise.resolve({ id: 'o2', label: 'Ivan Ilić · 063 1' }),
    )
    renderForm({ patientField: patientChooser, ownerOfPatient })

    await user.click(screen.getByRole('button', { name: 'Choose Luna' }))
    await user.click(screen.getByRole('button', { name: 'Choose Rex' }))
    expect(await screen.findByRole('status', { name: 'Owner' })).toHaveTextContent('Ivan Ilić')

    await act(async () => answerLunaLookup({ id: 'o1', label: 'Ana Petrović · 062 123 456' }))

    expect(screen.getByRole('status', { name: 'Owner' })).toHaveTextContent('Ivan Ilić')
    expect(screen.getByRole('status', { name: 'Owner' })).not.toHaveTextContent('Ana Petrović')
  })

  it('books without an owner when the lookup fails, so the backend takes it from the patient', async () => {
    const user = userEvent.setup()
    const createSpy = vi.spyOn(appointmentsApi, 'createAppointment').mockResolvedValue('a9')
    renderForm({
      patientField: patientChooser,
      ownerOfPatient: () => Promise.reject(new Error('offline')),
    })

    await pickTime(user, '07:00')
    await user.click(screen.getByRole('button', { name: 'Choose Luna' }))

    expect(await screen.findByRole('status', { name: 'Owner' })).toHaveTextContent(
      "The owner on the patient's card is used when you book.",
    )

    await user.click(screen.getByRole('button', { name: 'Book' }))

    await waitFor(() =>
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: undefined, patientId: 'p1' }),
      ),
    )
  })
})

describe('AppointmentFormPanel with no free time on the day', () => {
  const later: AvailabilitySlot[] = [
    {
      startsAt: '2026-09-19T06:00:00Z',
      endsAt: '2026-09-19T06:30:00Z',
      isAvailable: true,
      isMine: false,
    },
  ]

  it('says the day is full and jumps to the next free day', async () => {
    const user = userEvent.setup()
    availabilitySpy.mockImplementation(async (range: { from: string }) =>
      range.from.startsWith('2026-09-16') ? [] : later,
    )
    renderForm()

    expect(await screen.findByText('No free time left on 17.09.2026.')).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup', { name: 'Start time *' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next free day' }))

    await waitFor(() =>
      expect(screen.getByRole('radio', { name: '08:00' })).toHaveAttribute('aria-checked', 'true'),
    )
    expect(screen.getByRole('button', { name: 'Date *' })).toHaveTextContent('19.09.2026')
    expect(screen.queryByText(/No free time/)).not.toBeInTheDocument()
  })

  it('says so when nothing is free in the next two weeks', async () => {
    const user = userEvent.setup()
    availabilitySpy.mockResolvedValue([])
    renderForm()

    await user.click(await screen.findByRole('button', { name: 'Next free day' }))

    expect(await screen.findByText('No free time in the next 14 days.')).toBeInTheDocument()
  })

  it('forgets a finished search when another day is picked', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-16T12:00:00Z'))
    const user = userEvent.setup()
    availabilitySpy.mockResolvedValue([])
    renderForm()

    await user.click(await screen.findByRole('button', { name: 'Next free day' }))
    expect(await screen.findByText('No free time in the next 14 days.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '18.09.2026' }))

    expect(await screen.findByText('No free time left on 18.09.2026.')).toBeInTheDocument()
    expect(screen.queryByText('No free time in the next 14 days.')).not.toBeInTheDocument()
  })
})
