import { act, render as renderPlain, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createTestQueryClient,
  QueryWrapper,
  renderWithQuery as render,
} from '@/test/renderWithQuery'
import { ToastProvider } from '@/shared/ui'
import { ApiError } from '@/shared/lib/apiClient'
import { AppointmentsPage } from './AppointmentsPage'
import * as appointmentsApi from '@/features/appointments/api/appointmentsApi'
import * as patientsApi from '@/features/patients/api/patientsApi'
import * as ownersApi from '@/features/patients/api/ownersApi'
import { appointmentKeys } from '@/features/appointments'
import type { Appointment, AvailabilitySlot } from '@/features/appointments'

const slot: AvailabilitySlot = {
  startsAt: '2026-09-17T05:00:00Z',
  endsAt: '2026-09-17T05:30:00Z',
  isAvailable: false,
  isMine: false,
}

const scheduled: Appointment = {
  id: 'a1',
  createdByUserId: 'u1',
  patientId: 'p1',
  ownerId: 'o1',
  startsAt: '2026-09-17T05:00:00Z',
  endsAt: '2026-09-17T05:30:00Z',
  durationMinutes: 30,
  type: 'checkup',
  status: 'scheduled',
  ownerName: 'Ana Petrović',
  patientName: 'Luna',
  createdAt: '2026-09-10T10:00:00Z',
}

const cancelled: Appointment = { ...scheduled, id: 'a2', status: 'cancelled', patientName: 'Rex' }

function renderAt(path: string) {
  const router = createMemoryRouter([{ path: '/appointments', element: <AppointmentsPage /> }], {
    initialEntries: [path],
  })

  render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  )

  return router
}

let getAppointmentsSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  getAppointmentsSpy = vi
    .spyOn(appointmentsApi, 'getAppointments')
    .mockResolvedValue([scheduled, cancelled])
  vi.spyOn(appointmentsApi, 'getAvailability').mockResolvedValue([slot])
  vi.spyOn(appointmentsApi, 'getUnresolvedAppointments').mockResolvedValue([])
  vi.spyOn(patientsApi, 'getPatient').mockResolvedValue({
    id: 'p1',
    cardNumber: 'C26-1',
    name: 'Luna',
    species: 'cat',
    breedName: 'Chartreux',
    sex: 'female',
    isDeleted: false,
    ownerId: 'o1',
    breedId: 'b1',
    ownerName: 'Ana Petrović',
    phoneNumber: '062/8890021',
    city: 'Novi Sad',
    createdAt: '2026-08-27',
    allergies: [],
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AppointmentsPage', () => {
  it('requests the day range when the day view is open', async () => {
    renderAt('/appointments?view=day&date=2026-09-17')

    await waitFor(() =>
      expect(getAppointmentsSpy).toHaveBeenCalledWith({
        from: '2026-09-16T22:00:00.000Z',
        to: '2026-09-17T22:00:00.000Z',
      }),
    )
  })

  it('requests the week range by default', async () => {
    renderAt('/appointments?date=2026-09-17')

    await waitFor(() =>
      expect(getAppointmentsSpy).toHaveBeenCalledWith({
        from: '2026-09-13T22:00:00.000Z',
        to: '2026-09-20T22:00:00.000Z',
      }),
    )
  })

  it('hides cancelled appointments until the toggle is on', async () => {
    const user = userEvent.setup()
    renderAt('/appointments?view=day&date=2026-09-17')

    expect(await screen.findByRole('button', { name: /Luna/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Rex/ })).not.toBeInTheDocument()

    await user.click(screen.getByLabelText('Show cancelled'))

    expect(await screen.findByRole('button', { name: /Rex/ })).toBeInTheDocument()
  })

  it('reports a failed load and does not claim the clinic is closed', async () => {
    vi.spyOn(appointmentsApi, 'getAvailability').mockRejectedValue(new Error('boom'))
    getAppointmentsSpy.mockRejectedValue(new Error('boom'))

    renderAt('/appointments?view=day&date=2026-09-17')

    expect(await screen.findByText('Could not load appointments')).toBeInTheDocument()
    expect(screen.queryByText('The clinic is closed on this day.')).not.toBeInTheDocument()
  })

  it('opens the detail panel with the patient summary', async () => {
    const user = userEvent.setup()
    renderAt('/appointments?view=day&date=2026-09-17')

    await user.click(await screen.findByRole('button', { name: /Luna/ }))

    expect(await screen.findByText('Chartreux')).toBeInTheDocument()
  })

  it('explains a booking with no patient', async () => {
    getAppointmentsSpy.mockResolvedValue([
      { ...scheduled, patientId: undefined, patientName: undefined },
    ])
    const user = userEvent.setup()

    renderAt('/appointments?view=day&date=2026-09-17')
    await user.click(await screen.findByRole('button', { name: /No patient yet/ }))

    expect(
      await screen.findByText('Patient not yet assigned — resolved at check-in.'),
    ).toBeInTheDocument()
  })
})

describe('AppointmentsPage url state', () => {
  it('keeps the visible period in the url so a refresh restores it', async () => {
    const user = userEvent.setup()
    const router = renderAt('/appointments?view=day&date=2026-09-17')

    await user.click(screen.getByRole('button', { name: 'Next period' }))

    await waitFor(() => expect(router.state.location.search).toBe('?view=day&date=2026-09-18'))
  })

  it('records the cancelled toggle in the url', async () => {
    const user = userEvent.setup()
    const router = renderAt('/appointments?view=day&date=2026-09-17')

    await user.click(await screen.findByLabelText('Show cancelled'))

    await waitFor(() =>
      expect(router.state.location.search).toBe('?view=day&date=2026-09-17&cancelled=1'),
    )
  })

  it('restores the view from the url on load', async () => {
    renderAt('/appointments?view=month&date=2026-09-17&cancelled=1')

    expect(await screen.findByRole('button', { name: /Rex/ })).toBeInTheDocument()
    expect(screen.getAllByTestId(/^month-day-/)).toHaveLength(42)
  })
})

describe('AppointmentsPage selection', () => {
  function renderWithClient(path: string) {
    const client = createTestQueryClient()
    const router = createMemoryRouter([{ path: '/appointments', element: <AppointmentsPage /> }], {
      initialEntries: [path],
    })

    renderPlain(
      <QueryWrapper client={client}>
        <RouterProvider router={router} />
      </QueryWrapper>,
    )

    return client
  }

  it('keeps the panel on the appointment after a refetch', async () => {
    const user = userEvent.setup()
    const client = renderWithClient('/appointments?view=day&date=2026-09-17')

    await user.click(await screen.findByRole('button', { name: /Luna/ }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Scheduled')).toBeInTheDocument()

    getAppointmentsSpy.mockResolvedValue([{ ...scheduled, status: 'checked_in' }, cancelled])
    await act(() => client.invalidateQueries({ queryKey: appointmentKeys.all }))

    expect(await within(dialog).findByText('Checked in')).toBeInTheDocument()
  })

  it('still renders the calendar when availability fails', async () => {
    vi.spyOn(appointmentsApi, 'getAvailability').mockRejectedValue(new Error('down'))

    renderAt('/appointments?view=day&date=2026-09-17')

    expect(await screen.findByRole('button', { name: /Luna/ })).toBeInTheDocument()
    expect(await screen.findByText('Could not load opening hours')).toBeInTheDocument()
    expect(screen.queryByText('Appointments could not be loaded.')).not.toBeInTheDocument()
  })
})

describe('AppointmentsPage booking', () => {
  const freeSlot: AvailabilitySlot = {
    startsAt: '2026-09-17T05:30:00Z',
    endsAt: '2026-09-17T06:00:00Z',
    isAvailable: true,
    isMine: false,
  }

  beforeEach(() => {
    vi.spyOn(appointmentsApi, 'getAvailability').mockResolvedValue([slot, freeSlot])
    vi.spyOn(ownersApi, 'searchOwners').mockResolvedValue([])
    vi.spyOn(patientsApi, 'getPatients').mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 10,
    })
  })

  it('opens the booking form from the toolbar', async () => {
    const user = userEvent.setup()
    renderAt('/appointments?view=day&date=2026-09-17')

    await user.click(await screen.findByRole('button', { name: /New appointment/ }))

    expect(await screen.findByRole('dialog', { name: 'New appointment' })).toBeInTheDocument()
  })

  it('opens the form preselected from a free slot and books it', async () => {
    const user = userEvent.setup()
    const createSpy = vi.spyOn(appointmentsApi, 'createAppointment').mockResolvedValue('a9')
    renderAt('/appointments?view=day&date=2026-09-17')

    await user.click(await screen.findByRole('button', { name: 'Book 07:30' }))
    const dialog = await screen.findByRole('dialog', { name: 'New appointment' })

    await waitFor(() =>
      expect(within(dialog).getByRole('combobox', { name: 'Start time *' })).toHaveTextContent(
        '07:30',
      ),
    )

    await user.click(within(dialog).getByRole('button', { name: 'Book' }))

    await waitFor(() =>
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ startsAt: '2026-09-17T05:30:00Z', type: 1 }),
      ),
    )
    expect(await screen.findByText('Appointment booked')).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'New appointment' })).not.toBeInTheDocument()
  })
})

describe('AppointmentsPage actions', () => {
  beforeEach(() => {
    vi.spyOn(ownersApi, 'searchOwners').mockResolvedValue([])
    vi.spyOn(patientsApi, 'getPatients').mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 10,
    })
  })

  async function openLuna() {
    const user = userEvent.setup()
    renderAt('/appointments?view=day&date=2026-09-17')
    await user.click(await screen.findByRole('button', { name: /Luna/ }))
    await screen.findByRole('dialog')

    return user
  }

  it('opens the reschedule form from the detail panel', async () => {
    const user = await openLuna()

    await user.click(screen.getByRole('button', { name: 'Reschedule' }))

    expect(await screen.findByRole('dialog', { name: /^Move Luna/ })).toBeInTheDocument()
  })

  it('cancels with a reason and refreshes the panel', async () => {
    const cancelSpy = vi.spyOn(appointmentsApi, 'cancelAppointment').mockResolvedValue(undefined)
    const user = await openLuna()

    await user.click(screen.getByRole('button', { name: 'Cancel appointment' }))
    const dialog = await screen.findByRole('dialog', { name: 'Cancel this appointment?' })
    await user.type(within(dialog).getByLabelText('Reason (optional)'), 'owner called')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel appointment' }))

    await waitFor(() => expect(cancelSpy).toHaveBeenCalledWith('a1', 'owner called'))
    expect(await screen.findByText('Appointment cancelled')).toBeInTheDocument()
  })

  it('marks a no-show without a note', async () => {
    const noShowSpy = vi.spyOn(appointmentsApi, 'markNoShow').mockResolvedValue(undefined)
    const user = await openLuna()

    await user.click(screen.getByRole('button', { name: 'No-show' }))
    const dialog = await screen.findByRole('dialog', { name: 'Mark as no-show?' })
    await user.click(within(dialog).getByRole('button', { name: 'Mark no-show' }))

    await waitFor(() => expect(noShowSpy).toHaveBeenCalledWith('a1', undefined))
    expect(await screen.findByText('Marked as no-show')).toBeInTheDocument()
  })

  it('reports an invalid transition with the catalog message', async () => {
    vi.spyOn(appointmentsApi, 'cancelAppointment').mockRejectedValue(
      new ApiError(400, 'no', 'Appointments.InvalidTransition'),
    )
    const user = await openLuna()

    await user.click(screen.getByRole('button', { name: 'Cancel appointment' }))
    const dialog = await screen.findByRole('dialog', { name: 'Cancel this appointment?' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel appointment' }))

    expect(
      await screen.findByText('That change is not possible from the current status.'),
    ).toBeInTheDocument()
  })
})

describe('AppointmentsPage unresolved list', () => {
  const stale: Appointment = {
    ...scheduled,
    id: 'a7',
    startsAt: '2026-09-10T07:00:00Z',
    endsAt: '2026-09-10T07:30:00Z',
    patientName: 'Bela',
  }

  it('hides the banner when nothing needs closing', async () => {
    renderAt('/appointments?view=day&date=2026-09-17')

    await screen.findByRole('button', { name: /Luna/ })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('opens an appointment outside the visible range from the list', async () => {
    vi.spyOn(appointmentsApi, 'getUnresolvedAppointments').mockResolvedValue([stale])
    const detailSpy = vi.spyOn(appointmentsApi, 'getAppointment').mockResolvedValue(stale)
    const user = userEvent.setup()
    renderAt('/appointments?view=day&date=2026-09-17')

    await user.click(await screen.findByRole('button', { name: 'Review' }))
    await user.click(await screen.findByRole('button', { name: /Bela · Ana Petrović/ }))

    const dialog = await screen.findByRole('dialog', { name: /Appointment for Bela/ })
    expect(within(dialog).getAllByText('10.09.2026').length).toBeGreaterThan(0)
    expect(detailSpy).toHaveBeenCalledWith('a7')
  })

  it('keeps the panel open after rescheduling out of the visible range', async () => {
    const moved: Appointment = {
      ...scheduled,
      startsAt: '2026-09-24T07:00:00Z',
      endsAt: '2026-09-24T07:30:00Z',
    }
    vi.spyOn(appointmentsApi, 'rescheduleAppointment').mockImplementation(async () => {
      getAppointmentsSpy.mockResolvedValue([cancelled])
    })
    vi.spyOn(appointmentsApi, 'getAppointment').mockResolvedValue(moved)
    vi.spyOn(ownersApi, 'searchOwners').mockResolvedValue([])
    vi.spyOn(patientsApi, 'getPatients').mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 10,
    })
    const user = userEvent.setup()
    renderAt('/appointments?view=day&date=2026-09-17')

    await user.click(await screen.findByRole('button', { name: /Luna/ }))
    const detail = await screen.findByRole('dialog', { name: /Appointment for Luna/ })
    await user.click(within(detail).getByRole('button', { name: 'Reschedule' }))
    const form = await screen.findByRole('dialog', { name: /^Move Luna/ })
    await user.click(within(form).getByRole('button', { name: 'Move' }))

    expect(await screen.findByText('Appointment moved')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: /Appointment for Luna/ })).toHaveTextContent(
        '24.09.2026',
      ),
    )
  })
})
