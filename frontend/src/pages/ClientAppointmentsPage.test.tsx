import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { ApiError } from '@/shared/lib/apiClient'
import { clinicDayRange, clinicToday } from '@/shared/lib/clinicTime'
import * as appointmentsApi from '@/features/appointments/api/appointmentsApi'
import * as patientsApi from '@/features/patients/api/patientsApi'
import type { Appointment, AvailabilitySlot } from '@/features/appointments'
import type { PatientListItem } from '@/features/patients'
import { ClientAppointmentsPage } from './ClientAppointmentsPage'

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
    isAvailable: true,
    isMine: false,
  },
]

const scheduled: Appointment = {
  id: 'a1',
  createdByUserId: 'u1',
  startsAt: '2026-10-01T07:00:00Z',
  endsAt: '2026-10-01T07:30:00Z',
  durationMinutes: 30,
  type: 'checkup',
  status: 'scheduled',
  createdAt: '2026-09-10T10:00:00Z',
}

const later: Appointment = { ...scheduled, id: 'a2', startsAt: '2026-10-08T07:00:00Z' }
const checkedIn: Appointment = { ...scheduled, id: 'a3', status: 'checked_in' }

const completed: Appointment = {
  ...scheduled,
  id: 'a4',
  status: 'completed',
  startsAt: '2026-09-01T07:00:00Z',
  patientName: 'Luna',
}

const cancelled: Appointment = {
  ...scheduled,
  id: 'a5',
  status: 'cancelled',
  startsAt: '2026-09-05T07:00:00Z',
}

const luna: PatientListItem = {
  id: 'p1',
  cardNumber: 'C26-1',
  name: 'Luna',
  species: 'cat',
  breedName: 'Chartreux',
  sex: 'female',
  isDeleted: false,
  ownerName: 'Ana Petrović',
  phoneNumber: '062',
  city: 'Novi Sad',
  allergies: [],
}

function noPatients() {
  return { items: [], totalCount: 0, page: 1, pageSize: 20 }
}

let getAppointmentsSpy: ReturnType<typeof vi.spyOn>

// The two windows meet at clinic midnight today: one starts there, the other ends there.
const boundary = () => clinicDayRange(clinicToday()).from

function mockWindows(upcoming: Appointment[], past: Appointment[] = []) {
  getAppointmentsSpy.mockImplementation((range: { from: string; to: string }) =>
    Promise.resolve(range.from === boundary() ? upcoming : past),
  )
}

beforeEach(() => {
  getAppointmentsSpy = vi.spyOn(appointmentsApi, 'getAppointments')
  mockWindows([], [])
  vi.spyOn(appointmentsApi, 'getAvailability').mockResolvedValue(slots)
  vi.spyOn(patientsApi, 'getPatients').mockResolvedValue(noPatients())
})

afterEach(() => {
  vi.restoreAllMocks()
})

function listFor(name: 'Upcoming' | 'Past') {
  return screen.getByRole('heading', { name }).parentElement as HTMLElement
}

describe('ClientAppointmentsPage lists', () => {
  it('asks for a forward and a backward window', async () => {
    render(<ClientAppointmentsPage />)

    await waitFor(() => expect(getAppointmentsSpy).toHaveBeenCalledTimes(2))

    const ranges: { from: string; to: string }[] = getAppointmentsSpy.mock.calls.map(
      (call: unknown[]) => call[0] as { from: string; to: string },
    )
    expect(ranges.some((range) => range.from === boundary())).toBe(true)
    expect(ranges.some((range) => range.to === boundary())).toBe(true)
  })

  it('puts open visits under Upcoming, oldest first', async () => {
    mockWindows([later, scheduled])

    render(<ClientAppointmentsPage />)

    await screen.findAllByText(/01.10.2026/)
    const rows = within(listFor('Upcoming')).getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('01.10.2026')
    expect(rows[1]).toHaveTextContent('08.10.2026')
  })

  it('puts closed visits under Past, newest first, with the patient name', async () => {
    mockWindows([], [completed, cancelled])

    render(<ClientAppointmentsPage />)

    await screen.findAllByText(/05.09.2026/)
    const rows = within(listFor('Past')).getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('05.09.2026')
    expect(rows[0]).toHaveTextContent('Cancelled')
    expect(rows[1]).toHaveTextContent('01.09.2026')
    expect(rows[1]).toHaveTextContent('Luna')
    expect(
      within(listFor('Upcoming')).getByText('You have no upcoming visits.'),
    ).toBeInTheDocument()
  })

  it('says both lists are empty when there is nothing', async () => {
    render(<ClientAppointmentsPage />)

    expect(await screen.findByText('You have no upcoming visits.')).toBeInTheDocument()
    expect(screen.getByText('No past visits yet.')).toBeInTheDocument()
  })

  it('offers reschedule and cancel while scheduled, cancel only once checked in', async () => {
    mockWindows([scheduled, checkedIn])

    render(<ClientAppointmentsPage />)

    await screen.findAllByText(/01.10.2026/)
    const rows = within(listFor('Upcoming')).getAllByRole('listitem')
    const scheduledRow = rows.find((row) => row.textContent?.includes('Scheduled')) as HTMLElement
    const checkedInRow = rows.find((row) => row.textContent?.includes('Checked in')) as HTMLElement

    expect(within(scheduledRow).getByRole('button', { name: 'Reschedule' })).toBeInTheDocument()
    expect(within(scheduledRow).getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(
      within(checkedInRow).queryByRole('button', { name: 'Reschedule' }),
    ).not.toBeInTheDocument()
    expect(within(checkedInRow).getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('offers no actions on a past visit', async () => {
    mockWindows([], [completed])

    render(<ClientAppointmentsPage />)

    await screen.findAllByText(/01.09.2026/)
    const row = within(listFor('Past')).getAllByRole('listitem')[0]
    expect(within(row).queryByRole('button')).not.toBeInTheDocument()
  })

  it('reports a failed load', async () => {
    getAppointmentsSpy.mockRejectedValue(new Error('boom'))

    render(<ClientAppointmentsPage />)

    expect(await screen.findByText('Your visits could not be loaded.')).toBeInTheDocument()
  })
})

describe('ClientAppointmentsPage booking', () => {
  it('books a thin visit and explains who the animal is', async () => {
    const createSpy = vi.spyOn(appointmentsApi, 'createAppointment').mockResolvedValue('a9')
    const user = userEvent.setup()

    render(<ClientAppointmentsPage />)

    await user.click(screen.getByRole('button', { name: /Book a visit/ }))
    const panel = await screen.findByRole('dialog', { name: 'Book a visit' })

    expect(
      within(panel).getByText('The clinic will match this booking to your animal when you arrive.'),
    ).toBeInTheDocument()

    await user.click(within(panel).getByRole('combobox', { name: 'Start time *' }))
    await user.click(await screen.findByRole('option', { name: '07:00' }))
    await user.click(within(panel).getByRole('button', { name: 'Book' }))

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
    expect(await screen.findByText('Visit booked')).toBeInTheDocument()
  })

  it('offers the client their own animals when they have some', async () => {
    vi.spyOn(patientsApi, 'getPatients').mockResolvedValue({
      items: [luna],
      totalCount: 1,
      page: 1,
      pageSize: 20,
    })
    const createSpy = vi.spyOn(appointmentsApi, 'createAppointment').mockResolvedValue('a9')
    const user = userEvent.setup()

    render(<ClientAppointmentsPage />)

    await user.click(screen.getByRole('button', { name: /Book a visit/ }))
    const panel = await screen.findByRole('dialog', { name: 'Book a visit' })

    await user.click(within(panel).getByRole('button', { name: /^Patient/ }))
    await user.click(await screen.findByText('Luna · Ana Petrović'))
    await user.click(within(panel).getByRole('combobox', { name: 'Start time *' }))
    await user.click(await screen.findByRole('option', { name: '07:00' }))
    await user.click(within(panel).getByRole('button', { name: 'Book' }))

    await waitFor(() =>
      expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({ patientId: 'p1' })),
    )
  })
})

describe('ClientAppointmentsPage reschedule and cancel', () => {
  it('moves a visit to another slot', async () => {
    mockWindows([scheduled])
    const rescheduleSpy = vi
      .spyOn(appointmentsApi, 'rescheduleAppointment')
      .mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<ClientAppointmentsPage />)

    await screen.findAllByText(/01.10.2026/)
    await user.click(screen.getByRole('button', { name: 'Reschedule' }))
    const panel = await screen.findByRole('dialog', { name: 'Move your visit' })

    await user.click(within(panel).getByRole('combobox', { name: 'Start time *' }))
    await user.click(await screen.findByRole('option', { name: '07:30' }))
    await user.click(within(panel).getByRole('button', { name: 'Move' }))

    await waitFor(() =>
      expect(rescheduleSpy).toHaveBeenCalledWith('a1', {
        startsAt: '2026-09-17T05:30:00Z',
        durationMinutes: undefined,
      }),
    )
    expect(await screen.findByText('Visit moved')).toBeInTheDocument()
  })

  it('cancels a visit with a reason', async () => {
    mockWindows([scheduled])
    const cancelSpy = vi.spyOn(appointmentsApi, 'cancelAppointment').mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<ClientAppointmentsPage />)

    await screen.findAllByText(/01.10.2026/)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    const dialog = await screen.findByRole('dialog', { name: 'Cancel this visit?' })
    await user.type(within(dialog).getByLabelText('Reason (optional)'), 'travelling')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel visit' }))

    await waitFor(() => expect(cancelSpy).toHaveBeenCalledWith('a1', 'travelling'))
    expect(await screen.findByText('Visit cancelled')).toBeInTheDocument()
  })

  it('stays quiet when the visit was already gone', async () => {
    mockWindows([scheduled])
    vi.spyOn(appointmentsApi, 'cancelAppointment').mockRejectedValue(
      new ApiError(404, 'gone', 'Appointments.NotFound'),
    )
    const user = userEvent.setup()

    render(<ClientAppointmentsPage />)

    await screen.findAllByText(/01.10.2026/)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    const dialog = await screen.findByRole('dialog', { name: 'Cancel this visit?' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel visit' }))

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Cancel this visit?' })).not.toBeInTheDocument(),
    )
    expect(screen.queryByText('Could not cancel that visit.')).not.toBeInTheDocument()
    expect(screen.queryByText('Visit cancelled')).not.toBeInTheDocument()
  })

  it('reports a cancel that genuinely failed', async () => {
    mockWindows([scheduled])
    vi.spyOn(appointmentsApi, 'cancelAppointment').mockRejectedValue(
      new ApiError(400, 'no', 'Appointments.InvalidTransition'),
    )
    const user = userEvent.setup()

    render(<ClientAppointmentsPage />)

    await screen.findAllByText(/01.10.2026/)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    const dialog = await screen.findByRole('dialog', { name: 'Cancel this visit?' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel visit' }))

    expect(
      await screen.findByText('That change is not possible from the current status.'),
    ).toBeInTheDocument()
  })
})
