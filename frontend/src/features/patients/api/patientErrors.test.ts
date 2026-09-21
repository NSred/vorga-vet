import { describe, expect, it } from 'vitest'
import { patientErrors } from './patientErrors'

describe('patientErrors', () => {
  it('mirrors the backend catalogs', () => {
    expect(Object.values(patientErrors)).toEqual([
      'Patients.NotFound',
      'Patients.AlreadyDeleted',
      'Patients.CardNumberNotUnique',
      'Owners.NotFound',
      'Breeds.NotFound',
      'Allergens.NotFound',
    ])
  })
})
