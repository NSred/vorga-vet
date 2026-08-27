import { describe, expect, it } from 'vitest'
import { toPatientWriteRequest } from './patientRequest'
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

describe('toPatientWriteRequest', () => {
  it('maps ids out of the selected objects and sex to its integer', () => {
    const request = toPatientWriteRequest(base)

    expect(request.ownerId).toBe('owner-1')
    expect(request.breedId).toBe('breed-1')
    expect(request.sex).toBe(1)
    expect(request.cardNumber).toBe('D26-04821')
    expect(request.allergenIds).toEqual([])
  })

  it('extracts allergen ids in selection order', () => {
    const request = toPatientWriteRequest({
      ...base,
      allergens: [
        { id: 'a1', name: 'food' },
        { id: 'a2', name: 'pollen' },
      ],
    })

    expect(request.allergenIds).toEqual(['a1', 'a2'])
  })

  it('omits optional fields that are empty rather than sending empty strings', () => {
    const request = toPatientWriteRequest({ ...base, color: '', chipNumber: '   ', note: '' })

    expect(request.color).toBeUndefined()
    expect(request.chipNumber).toBeUndefined()
    expect(request.note).toBeUndefined()
  })

  it('keeps optional fields that have content, trimmed', () => {
    const request = toPatientWriteRequest({ ...base, color: ' brindle ', weightKg: 24.5 })

    expect(request.color).toBe('brindle')
    expect(request.weightKg).toBe(24.5)
  })

  it('sends the birth date as an explicit UTC instant', () => {
    const request = toPatientWriteRequest({ ...base, birthDate: '2026-02-02' })

    expect(request.birthDate).toBe('2026-02-02T00:00:00Z')
  })

  it('omits the birth date when it is not set', () => {
    expect(toPatientWriteRequest({ ...base, birthDate: '' }).birthDate).toBeUndefined()
    expect(toPatientWriteRequest({ ...base, birthDate: undefined }).birthDate).toBeUndefined()
  })

  it('does not send species, which is a UI-only field', () => {
    const request = toPatientWriteRequest(base) as unknown as Record<string, unknown>

    expect(request.species).toBeUndefined()
  })

  it('throws when owner or breed is missing, which validation should have prevented', () => {
    expect(() => toPatientWriteRequest({ ...base, owner: null })).toThrow(/owner/i)
    expect(() => toPatientWriteRequest({ ...base, breed: null })).toThrow(/breed/i)
  })
})
