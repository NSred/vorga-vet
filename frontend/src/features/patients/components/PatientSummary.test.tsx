import { screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import { PatientSummary } from './PatientSummary'
import * as patientsApi from '../api/patientsApi'
import { ApiError } from '@/shared/lib/apiClient'
import type { PatientDetail } from '../types'

const patient: PatientDetail = {
  id: 'p1',
  cardNumber: 'C26-57465',
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
  allergies: [{ id: 'al1', name: 'Pollen' }],
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PatientSummary', () => {
  it('shows the record details', async () => {
    vi.spyOn(patientsApi, 'getPatient').mockResolvedValue(patient)

    render(<PatientSummary patientId="p1" />)

    expect(await screen.findByText('C26-57465')).toBeInTheDocument()
    expect(screen.getByText('Chartreux')).toBeInTheDocument()
    expect(screen.getByText('Pollen')).toBeInTheDocument()
    expect(screen.getByText('062/8890021')).toBeInTheDocument()
  })

  it('reports a failure inline', async () => {
    vi.spyOn(patientsApi, 'getPatient').mockRejectedValue(new ApiError(500, 'boom'))

    render(<PatientSummary patientId="p1" />)

    await waitFor(() =>
      expect(screen.getByText('Could not load the patient record.')).toBeInTheDocument(),
    )
  })
})
