import { describe, expect, it } from 'vitest'
import {
  emptyExaminationValues,
  examinationValuesOf,
  parseCost,
  toExaminationDetails,
} from './examinationDetails'

describe('toExaminationDetails', () => {
  it('trims text and drops empty optionals', () => {
    expect(
      toExaminationDetails({
        performedByFirstName: ' Mira ',
        performedByLastName: 'Vet',
        anamnesis: '  ',
        diagnosis: ' otitis ',
        therapy: '',
        cost: '',
      }),
    ).toEqual({
      performedByFirstName: 'Mira',
      performedByLastName: 'Vet',
      anamnesis: undefined,
      diagnosis: 'otitis',
      therapy: undefined,
      cost: undefined,
    })
  })

  it('parses the cost with a comma or a dot', () => {
    expect(parseCost('45,50')).toBe(45.5)
    expect(parseCost('45.50')).toBe(45.5)
    expect(parseCost('0')).toBe(0)
    expect(parseCost('abc')).toBeUndefined()
    expect(parseCost('')).toBeUndefined()
  })

  it('builds empty values with optional performer names', () => {
    expect(emptyExaminationValues('Mira', 'Vet')).toMatchObject({
      performedByFirstName: 'Mira',
      performedByLastName: 'Vet',
      cost: '',
    })
  })
})

describe('examinationValuesOf', () => {
  it('fills the form from a recorded examination', () => {
    expect(
      examinationValuesOf({
        id: 'e1',
        patientId: 'p1',
        performedByFirstName: 'Mira',
        performedByLastName: 'Vet',
        startedAt: '2026-09-17T07:00:00Z',
        diagnosis: 'otitis',
        cost: 45.5,
        isPaid: false,
        createdAt: '2026-09-17T07:30:00Z',
        attachments: [],
      }),
    ).toEqual({
      performedByFirstName: 'Mira',
      performedByLastName: 'Vet',
      anamnesis: '',
      diagnosis: 'otitis',
      therapy: '',
      cost: '45.5',
    })
  })

  it('leaves the cost empty when none was recorded', () => {
    const values = examinationValuesOf({
      id: 'e1',
      patientId: 'p1',
      performedByFirstName: 'Mira',
      performedByLastName: 'Vet',
      startedAt: '2026-09-17T07:00:00Z',
      isPaid: false,
      createdAt: '2026-09-17T07:30:00Z',
      attachments: [],
    })

    expect(values.cost).toBe('')
    expect(values.diagnosis).toBe('')
  })
})
