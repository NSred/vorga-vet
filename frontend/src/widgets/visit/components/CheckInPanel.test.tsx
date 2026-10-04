import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { ApiError } from '@/shared/lib/apiClient'
import * as appointmentsApi from '@/features/appointments/api/appointmentsApi'
import * as ownersApi from '@/features/patients/api/ownersApi'
import * as patientsApi from '@/features/patients/api/patientsApi'
import type { Appointment } from '@/features/appointments'
import { CheckInPanel } from './CheckInPanel'

const full: Appointment = {
  id: 'a1',
  createdByUserId: 'u1',
  ownerId: 'o1',
  patientId: 'p1',
  startsAt: '2026-09-17T05:00:00Z',
  endsAt: '2026-09-17T05:30:00Z',
  durationMinutes: 30,
  type: 'checkup',
  status: 'scheduled',
  ownerName: 'Ana Petrović',
  patientName: 'Luna',
  createdAt: '2026-09-10T10:00:00Z',
}

const thin: Appointment = {
  ...full,
  ownerId: undefined,
  patientId: undefined,
  patientName: undefined,
  ownerName: undefined,
}

function renderPanel(appointment: Appointment) {
  const props = { onOpenChange: vi.fn(), onDone: vi.fn(), onFailed: vi.fn() }
  render(<CheckInPanel appointment={appointment} open {...props} />)

  return props
}

let checkInSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  checkInSpy = vi
    .spyOn(appointmentsApi, 'checkInAppointment')
    .mockResolvedValue({ ownerId: 'o1', patientId: 'p1' })
  vi.spyOn(ownersApi, 'searchOwners').mockResolvedValue([
    { id: 'o1', firstName: 'Ana', lastName: 'Petrović', phoneNumber: '062' },
  ])
  vi.spyOn(patientsApi, 'getPatients').mockResolvedValue({
    items: [
      {
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
      },
    ],
    totalCount: 1,
    page: 1,
    pageSize: 10,
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CheckInPanel', () => {
  it('confirms a full booking in one click with an empty body', async () => {
    const user = userEvent.setup()
    const props = renderPanel(full)

    expect(screen.getByRole('dialog', { name: /Check in Luna/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Check in' }))

    await waitFor(() => expect(checkInSpy).toHaveBeenCalledWith('a1', {}))
    expect(props.onDone).toHaveBeenCalledWith({ ownerId: 'o1', patientId: 'p1' })
  })

  it('requires the missing parties before posting', async () => {
    const user = userEvent.setup()
    renderPanel(thin)

    await user.click(screen.getByRole('button', { name: 'Check in' }))

    expect(await screen.findByText('Pick or create the owner')).toBeInTheDocument()
    expect(screen.getByText('Pick the patient or enter a new card')).toBeInTheDocument()
    expect(checkInSpy).not.toHaveBeenCalled()
  })

  it('posts the picked owner and patient for a thin booking', async () => {
    const user = userEvent.setup()
    const props = renderPanel(thin)

    await user.click(screen.getByRole('button', { name: /Owner/ }))
    await user.click(await screen.findByText('Petrović Ana'))
    await user.click(screen.getByRole('button', { name: /^Patient/ }))
    await user.click(await screen.findByText('Luna · Ana Petrović'))
    await user.click(screen.getByRole('button', { name: 'Check in' }))

    await waitFor(() =>
      expect(checkInSpy).toHaveBeenCalledWith('a1', {
        owner: { existingOwnerId: 'o1' },
        patient: { existingPatientId: 'p1' },
      }),
    )
    expect(props.onDone).toHaveBeenCalled()
  })

  it('marks the patient field when it belongs to another owner', async () => {
    checkInSpy.mockRejectedValue(
      new ApiError(400, 'mismatch', 'Appointments.PatientDoesNotBelongToOwner'),
    )
    const user = userEvent.setup()
    renderPanel(thin)

    await user.click(screen.getByRole('button', { name: /Owner/ }))
    await user.click(await screen.findByText('Petrović Ana'))
    await user.click(screen.getByRole('button', { name: /^Patient/ }))
    await user.click(await screen.findByText('Luna · Ana Petrović'))
    await user.click(screen.getByRole('button', { name: 'Check in' }))

    expect(
      await screen.findByText('This patient belongs to a different owner.'),
    ).toBeInTheDocument()
  })

  it('hands an invalid transition back to the page', async () => {
    checkInSpy.mockRejectedValue(new ApiError(400, 'no', 'Appointments.InvalidTransition'))
    const user = userEvent.setup()
    const props = renderPanel(full)

    await user.click(screen.getByRole('button', { name: 'Check in' }))

    await waitFor(() =>
      expect(props.onFailed).toHaveBeenCalledWith(
        'That change is not possible from the current status.',
      ),
    )
  })
})
