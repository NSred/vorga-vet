import { describe, expect, it } from 'vitest'
import { toPatientDetail, toPatientListItem } from './patientMapping'
import type { PatientDetailDto, PatientListItemDto } from '../types'

const listDto: PatientListItemDto = {
  id: 'p1',
  cardNumber: 'D26-04821',
  name: 'Rex',
  species: 0,
  breedName: 'Pug',
  sex: 1,
  birthDate: '2020-05-01T00:00:00',
  weightKg: 12.5,
  color: null,
  chipNumber: null,
  isDeleted: false,
  ownerName: 'Marko Marković',
  phoneNumber: '060/1234567',
  address: null,
  city: 'Novi Sad',
  allergies: ['Pollen'],
}

describe('toPatientListItem', () => {
  it('maps integer enums to string unions', () => {
    const item = toPatientListItem(listDto)

    expect(item.species).toBe('dog')
    expect(item.sex).toBe('female')
  })

  it('slices the birth date to date-only', () => {
    expect(toPatientListItem(listDto).birthDate).toBe('2020-05-01')
  })

  it('normalises nulls to undefined so formatValue keeps working', () => {
    const item = toPatientListItem(listDto)

    expect(item.color).toBeUndefined()
    expect(item.chipNumber).toBeUndefined()
    expect(item.address).toBeUndefined()
  })

  it('leaves a missing birth date undefined', () => {
    expect(toPatientListItem({ ...listDto, birthDate: null }).birthDate).toBeUndefined()
  })

  it('carries allergen names across', () => {
    expect(toPatientListItem(listDto).allergies).toEqual(['Pollen'])
  })
})

describe('toPatientDetail', () => {
  const detailDto: PatientDetailDto = {
    ...listDto,
    ownerId: 'o1',
    breedId: 'b1',
    anamnesis: 'Routine checkup.',
    note: null,
    createdAt: '2026-08-27T09:15:00',
    allergies: [{ id: 'a1', name: 'Pollen' }],
  }

  it('maps the shared fields the same way', () => {
    const detail = toPatientDetail(detailDto)

    expect(detail.species).toBe('dog')
    expect(detail.birthDate).toBe('2020-05-01')
  })

  it('slices createdAt to date-only', () => {
    expect(toPatientDetail(detailDto).createdAt).toBe('2026-08-27')
  })

  it('keeps allergens as options and normalises the note', () => {
    const detail = toPatientDetail(detailDto)

    expect(detail.allergies).toEqual([{ id: 'a1', name: 'Pollen' }])
    expect(detail.note).toBeUndefined()
    expect(detail.anamnesis).toBe('Routine checkup.')
  })
})
