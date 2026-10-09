import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { ApiError } from '@/shared/lib/apiClient'
import * as examinationsApi from '@/features/examinations/api/examinationsApi'
import * as patientsApi from '@/features/patients/api/patientsApi'
import type { PatientDetail } from '@/features/patients'
import { PatientRecord } from './PatientRecord'

vi.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { userId: 'u1', email: 'user@example.com', role: 'veterinarian' } }),
  useCurrentUser: () => ({
    data: { id: 'u1', firstName: 'Mira', lastName: 'Vet', email: 'v@x.com' },
  }),
}))

const rex: PatientDetail = {
  id: 'p1',
  cardNumber: 'D26-04821',
  name: 'Rex',
  species: 'dog',
  breedName: 'Pug',
  sex: 'male',
  isDeleted: false,
  ownerName: 'Ana Petrović',
  phoneNumber: '062 123 456',
  city: 'Novi Sad',
  allergies: [],
  ownerId: 'o1',
  breedId: 'b1',
  createdAt: '2026-01-01',
}

beforeEach(() => {
  vi.spyOn(examinationsApi, 'getPatientExaminations').mockResolvedValue([])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PatientRecord', () => {
  it('renders nothing until a patient is chosen', () => {
    const getPatient = vi.spyOn(patientsApi, 'getPatient').mockResolvedValue(rex)

    render(<PatientRecord patientId={null} onClose={vi.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(getPatient).not.toHaveBeenCalled()
  })

  it('opens the record once the patient has loaded', async () => {
    vi.spyOn(patientsApi, 'getPatient').mockResolvedValue(rex)

    render(<PatientRecord patientId="p1" onClose={vi.fn()} />)

    expect(await screen.findByRole('dialog', { name: 'Record for Rex' })).toBeInTheDocument()
  })

  it('closes when the patient cannot be loaded', async () => {
    vi.spyOn(patientsApi, 'getPatient').mockRejectedValue(new ApiError(404, 'gone'))
    const onClose = vi.fn()

    render(<PatientRecord patientId="p1" onClose={onClose} />)

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(screen.queryByRole('dialog', { name: 'Record for Rex' })).not.toBeInTheDocument()
  })

  it('closes with a toast after the patient is deleted', async () => {
    const user = userEvent.setup()
    vi.spyOn(patientsApi, 'getPatient').mockResolvedValue(rex)
    vi.spyOn(patientsApi, 'deletePatient').mockResolvedValue(undefined)
    const onClose = vi.fn()

    render(<PatientRecord patientId="p1" onClose={onClose} />)
    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    const confirm = await screen.findByRole('dialog', { name: 'Delete this record?' })
    await user.click(within(confirm).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(await screen.findByText('Patient deleted')).toBeInTheDocument()
  })
})
