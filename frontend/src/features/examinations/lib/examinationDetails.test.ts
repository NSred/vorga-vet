import { describe, expect, it } from 'vitest'
import {
  emptyExaminationValues,
  examinationValuesOf,
  toExaminationDetails,
} from './examinationDetails'

describe('toExaminationDetails', () => {
  it('trims text, drops empty optionals and takes the cost from the charges', () => {
    expect(
      toExaminationDetails(
        {
          performedByFirstName: ' Mira ',
          performedByLastName: 'Vet',
          anamnesis: '  ',
          diagnosis: ' otitis ',
          therapy: '',
        },
        3200,
      ),
    ).toEqual({
      performedByFirstName: 'Mira',
      performedByLastName: 'Vet',
      anamnesis: undefined,
      diagnosis: 'otitis',
      therapy: undefined,
      cost: 3200,
    })
  })

  it('sends no cost when there are no charges', () => {
    expect(toExaminationDetails(emptyExaminationValues('Mira', 'Vet')).cost).toBeUndefined()
  })

  it('builds empty values with optional performer names', () => {
    expect(emptyExaminationValues('Mira', 'Vet')).toEqual({
      performedByFirstName: 'Mira',
      performedByLastName: 'Vet',
      anamnesis: '',
      diagnosis: '',
      therapy: '',
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
    })
  })
})
