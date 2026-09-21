import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { ToastProvider } from '@/shared/ui'
import { AppointmentsPage } from './AppointmentsPage'
import * as appointmentsApi from '@/features/appointments/api/appointmentsApi'
import * as patientsApi from '@/features/patients/api/patientsApi'
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

    await waitFor(() =>
      expect(router.state.location.search).toBe('?view=day&date=2026-09-18'),
    )
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
