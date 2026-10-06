import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithQuery as render } from '@/test/renderWithQuery'
import * as examinationsApi from '@/features/examinations/api/examinationsApi'
import type { PatientDetail } from '@/features/patients'
import { PatientCardPanel } from './PatientCardPanel'

const auth = vi.hoisted(() => ({ role: 'veterinarian' as 'veterinarian' | 'client' }))

vi.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { userId: 'u1', email: 'user@example.com', role: auth.role } }),
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

const SECTIONS = ['Vaccinations', 'Microchip', 'Reminders', 'Visits']

function renderCard() {
  render(
    <PatientCardPanel
      patient={rex}
      open
      onOpenChange={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onEditVisit={vi.fn()}
    />,
  )
}

beforeEach(() => {
  vi.spyOn(examinationsApi, 'getPatientExaminations').mockResolvedValue([])
})

afterEach(() => {
  auth.role = 'veterinarian'
  vi.restoreAllMocks()
})

describe('PatientCardPanel', () => {
  it('gives a vet the clinical sections and the edit and delete actions', async () => {
    renderCard()

    expect(await screen.findByRole('dialog', { name: 'Record for Rex' })).toBeInTheDocument()
    for (const section of SECTIONS) {
      expect(screen.getByRole('heading', { name: section })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: '✎ Edit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('shows a client only the record, without clinical sections or actions', async () => {
    auth.role = 'client'
    renderCard()

    expect(await screen.findByRole('dialog', { name: 'Record for Rex' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Basic information' })).toBeInTheDocument()
    for (const section of SECTIONS) {
      expect(screen.queryByRole('heading', { name: section })).not.toBeInTheDocument()
    }
    expect(screen.queryByRole('button', { name: '✎ Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })
})
