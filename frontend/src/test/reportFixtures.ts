import type { Examination } from '@/features/examinations'
import type { PatientListItem } from '@/features/patients'

export function reportPatient(overrides: Partial<PatientListItem> = {}): PatientListItem {
  return {
    id: 'p1',
    cardNumber: 'C26-1',
    name: 'Luna',
    species: 'cat',
    breedName: 'Chartreux',
    sex: 'female',
    isDeleted: false,
    ownerName: 'Ana Petrović',
    phoneNumber: '062 123 456',
    city: 'Novi Sad',
    allergies: [],
    ...overrides,
  }
}

export function reportExamination(overrides: Partial<Examination> = {}): Examination {
  return {
    id: 'e1',
    patientId: 'p1',
    performedByFirstName: 'Marko',
    performedByLastName: 'Jovanović',
    startedAt: '2026-10-05T08:00:00Z',
    diagnosis: 'Otitis externa',
    cost: 2500,
    isPaid: false,
    createdAt: '2026-10-05T08:00:00Z',
    attachments: [],
    ...overrides,
  }
}
