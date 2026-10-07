import { describe, expect, it } from 'vitest'
import type { PatientListItem } from '../types'
import { patientLabel } from './patientLabel'

const patient: PatientListItem = {
  id: 'p1',
  cardNumber: 'D25-10001',
  name: 'Max',
  species: 'dog',
  breedName: 'Labrador Retriever',
  sex: 'male',
  isDeleted: false,
  ownerName: 'Marko Petrović',
  phoneNumber: '+381 64 123 4567',
  city: 'Novi Sad',
  allergies: [],
}

describe('patientLabel', () => {
  it('names the patient with the owner', () => {
    expect(patientLabel(patient)).toBe('Max · Marko Petrović')
  })
})
