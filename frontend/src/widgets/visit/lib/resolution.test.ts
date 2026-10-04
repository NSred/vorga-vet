import { describe, expect, it } from 'vitest'
import type { Appointment } from '@/features/appointments'
import {
  emptyResolution,
  hasErrors,
  needsAnything,
  needsFor,
  toResolution,
  validateResolution,
  type ResolutionValues,
} from './resolution'

const appointment: Appointment = {
  id: 'a1',
  createdByUserId: 'u1',
  startsAt: '2026-09-17T05:00:00Z',
  endsAt: '2026-09-17T05:30:00Z',
  durationMinutes: 30,
  type: 'checkup',
  status: 'scheduled',
  createdAt: '2026-09-10T10:00:00Z',
}

const owner = { id: 'o1', firstName: 'Ana', lastName: 'Petrović', phoneNumber: '062' }
const patient = {
  id: 'p1',
  cardNumber: 'C26-1',
  name: 'Luna',
  species: 'cat' as const,
  breedName: 'Chartreux',
  sex: 'female' as const,
  isDeleted: false,
  ownerName: 'Ana Petrović',
  phoneNumber: '062',
  city: 'Novi Sad',
  allergies: [],
}

describe('needsFor', () => {
  it('reports which parties the booking lacks', () => {
    expect(needsFor(appointment)).toEqual({ owner: true, patient: true })
    expect(needsFor({ ...appointment, ownerId: 'o1' })).toEqual({ owner: false, patient: true })
    expect(needsAnything(needsFor({ ...appointment, ownerId: 'o1', patientId: 'p1' }))).toBe(false)
  })
})

describe('validateResolution', () => {
  it('requires the missing parties only', () => {
    const errors = validateResolution(emptyResolution(), { owner: true, patient: true })

    expect(errors.owner).toBeDefined()
    expect(errors.patient).toBeDefined()
    expect(hasErrors(validateResolution(emptyResolution(), { owner: false, patient: false }))).toBe(
      false,
    )
  })

  it('requires name, breed and card number for a new patient', () => {
    const values: ResolutionValues = {
      ...emptyResolution(),
      owner,
      patientMode: 'new',
      newPatient: { ...emptyResolution().newPatient, cardNumber: '' },
    }

    const errors = validateResolution(values, { owner: true, patient: true })

    expect(errors).toEqual({
      name: 'Name is required',
      breed: 'Breed is required',
      cardNumber: 'No. is required',
    })
  })
})

describe('toResolution', () => {
  it('sends an existing owner and patient by id', () => {
    const values: ResolutionValues = { ...emptyResolution(), owner, patient }

    expect(toResolution(values, { owner: true, patient: true })).toEqual({
      owner: { existingOwnerId: 'o1' },
      patient: { existingPatientId: 'p1' },
    })
  })

  it('sends a new card with the sex mapped and empty optionals dropped', () => {
    const values: ResolutionValues = {
      ...emptyResolution(),
      owner,
      patientMode: 'new',
      newPatient: {
        species: 'dog',
        breed: { id: 'b1', name: 'Pug' },
        name: ' Rex ',
        sex: 'female',
        cardNumber: 'D26-00001',
        birthDate: '',
        color: 'fawn',
        chipNumber: '',
        note: '',
      },
    }

    expect(toResolution(values, { owner: false, patient: true })).toEqual({
      patient: {
        create: {
          breedId: 'b1',
          cardNumber: 'D26-00001',
          name: 'Rex',
          sex: 1,
          birthDate: undefined,
          color: 'fawn',
          chipNumber: undefined,
          note: undefined,
        },
      },
    })
  })

  it('sends nothing for parties the booking already has', () => {
    const values: ResolutionValues = { ...emptyResolution(), owner, patient }

    expect(toResolution(values, { owner: false, patient: false })).toEqual({})
  })
})
