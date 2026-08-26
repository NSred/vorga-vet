import { describe, expect, it } from 'vitest'
import { toCreatePatientRequest } from './patientRequest'
import type { PatientFormValues } from '../types'

const base: PatientFormValues = {
  cardNumber: 'D26-04821',
  name: 'Bela',
  species: 'dog',
  owner: { id: 'owner-1', firstName: 'Vladimir', lastName: 'Subić', phoneNumber: '060' },
  breed: { id: 'breed-1', name: 'American Staffordshire Terrier' },
  sex: 'female',
  allergens: [],
}

describe('toCreatePatientRequest', () => {
  it('maps ids out of the selected objects and sex to its integer', () => {
    const request = toCreatePatientRequest(base)

    expect(request.ownerId).toBe('owner-1')
    expect(request.breedId).toBe('breed-1')
    expect(request.sex).toBe(1)
    expect(request.cardNumber).toBe('D26-04821')
    expect(request.allergenIds).toEqual([])
  })

  it('extracts allergen ids in selection order', () => {
    const request = toCreatePatientRequest({
      ...base,
      allergens: [
        { id: 'a1', name: 'food' },
        { id: 'a2', name: 'pollen' },
      ],
    })

    expect(request.allergenIds).toEqual(['a1', 'a2'])
  })

  it('omits optional fields that are empty rather than sending empty strings', () => {
    const request = toCreatePatientRequest({ ...base, color: '', chipNumber: '   ', note: '' })

    expect(request.color).toBeUndefined()
    expect(request.chipNumber).toBeUndefined()
    expect(request.note).toBeUndefined()
  })

  it('keeps optional fields that have content, trimmed', () => {
    const request = toCreatePatientRequest({ ...base, color: ' brindle ', weightKg: 24.5 })

    expect(request.color).toBe('brindle')
    expect(request.weightKg).toBe(24.5)
  })

  it('sends the birth date as an explicit UTC instant', () => {
    const request = toCreatePatientRequest({ ...base, birthDate: '2026-02-02' })

    expect(request.birthDate).toBe('2026-02-02T00:00:00Z')
  })

  it('omits the birth date when it is not set', () => {
    expect(toCreatePatientRequest({ ...base, birthDate: '' }).birthDate).toBeUndefined()
    expect(toCreatePatientRequest({ ...base, birthDate: undefined }).birthDate).toBeUndefined()
  })

  it('does not send species, which is a UI-only field', () => {
    const request = toCreatePatientRequest(base) as unknown as Record<string, unknown>

    expect(request.species).toBeUndefined()
  })

  it('throws when owner or breed is missing, which validation should have prevented', () => {
    expect(() => toCreatePatientRequest({ ...base, owner: null })).toThrow(/owner/i)
    expect(() => toCreatePatientRequest({ ...base, breed: null })).toThrow(/breed/i)
  })
})
