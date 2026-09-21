import { describe, expect, it } from 'vitest'
import { emptyExaminationValues, parseCost, toExaminationDetails } from './examinationDetails'

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
