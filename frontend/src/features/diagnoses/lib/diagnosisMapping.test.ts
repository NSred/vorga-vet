import { describe, expect, it } from 'vitest'
import {
  diagnosisValuesOf,
  splitPastedNames,
  statusToApi,
  toDiagnosis,
  toDiagnosisRequest,
} from './diagnosisMapping'
import { parseDiagnosisParams, writeDiagnosisParams } from './diagnosisParams'

describe('diagnosis mapping', () => {
  it('maps status, DTOs and form values', () => {
    expect(statusToApi('retired')).toBe(2)
    expect(
      toDiagnosis({ id: 'd1', code: null, name: 'Cystitis', isActive: true, createdAt: 'x' }),
    ).toEqual({ id: 'd1', name: 'Cystitis', isActive: true })
    expect(diagnosisValuesOf({ id: 'd1', name: 'Cystitis', code: 'D9', isActive: true })).toEqual({
      name: 'Cystitis',
      code: 'D9',
    })
    expect(toDiagnosisRequest({ name: ' Cystitis ', code: '  ' })).toEqual({
      name: 'Cystitis',
      code: null,
    })
  })

  it('splits a pasted list, dropping blanks and repeats in the paste', () => {
    expect(splitPastedNames('Otitis media\r\n\n  cystitis \nCystitis\nRhinitis')).toEqual([
      'Otitis media',
      'cystitis',
      'Rhinitis',
    ])
  })

  it('reads and writes the tab params without touching other keys', () => {
    const parsed = parseDiagnosisParams(new URLSearchParams('tab=diagnoses&status=retired&page=2'))
    expect(parsed).toEqual({ filters: { status: 'retired' }, page: 2, pageSize: 25 })

    const written = writeDiagnosisParams(new URLSearchParams('tab=diagnoses&page=2'), {
      filters: { search: 'otitis', status: 'active' },
      page: 1,
      pageSize: 50,
    })
    expect(written.toString()).toBe('tab=diagnoses&search=otitis&pageSize=50')
  })
})
