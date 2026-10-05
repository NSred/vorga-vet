import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/lib/apiClient'
import {
  createDiagnosis,
  DIAGNOSES_STORAGE_KEY,
  importDiagnoses,
  listDiagnoses,
  resetDiagnosesStore,
  setDiagnosisActive,
  updateDiagnosis,
} from './mockDiagnosesStore'

const ACTIVE = 0
const ALL = 1
const RETIRED = 2

function codeOf(action: () => unknown): string | undefined {
  try {
    action()
  } catch (error) {
    return error instanceof ApiError ? error.code : 'not an ApiError'
  }
  return undefined
}

function names(status: number, search?: string): string[] {
  return listDiagnoses({ search, status, page: 1, pageSize: 100 }).items.map((item) => item.name)
}

beforeEach(() => {
  resetDiagnosesStore()
})

describe('mock diagnoses store', () => {
  it('starts from the seed with two retired entries', () => {
    expect(names(ACTIVE)).toHaveLength(15)
    expect(names(RETIRED)).toEqual(['Dehelmintizacija', 'Vakcinacija'])
    expect(names(ALL)).toHaveLength(17)
  })

  it('searches the name or the code', () => {
    expect(names(ACTIVE, 'otitis')).toEqual(['Otitis externa'])
    expect(names(ACTIVE, 'd03')).toEqual(['Dermatitis allergica'])
  })

  it('pages and normalizes the page size', () => {
    const page = listDiagnoses({ status: ALL, page: 2, pageSize: 10 })
    expect(page.items).toHaveLength(7)
    expect(listDiagnoses({ status: ALL, page: 0, pageSize: 0 })).toMatchObject({
      page: 1,
      pageSize: 25,
    })
  })

  it('creates with a trimmed name and an optional code', () => {
    const id = createDiagnosis({ name: '  Otitis media ', code: ' ' })
    const created = listDiagnoses({ search: 'media', status: ACTIVE, page: 1, pageSize: 25 })
      .items[0]

    expect(created).toMatchObject({ id, name: 'Otitis media', code: null })
  })

  it('refuses a duplicate name, retired ones included, and a duplicate code', () => {
    expect(codeOf(() => createDiagnosis({ name: 'otitis EXTERNA' }))).toBe(
      'Diagnoses.NameNotUnique',
    )
    expect(codeOf(() => createDiagnosis({ name: 'Vakcinacija' }))).toBe('Diagnoses.NameNotUnique')
    expect(codeOf(() => createDiagnosis({ name: 'Otitis media', code: 'd01' }))).toBe(
      'Diagnoses.CodeNotUnique',
    )
  })

  it('validates name and code', () => {
    expect(codeOf(() => createDiagnosis({ name: ' ' }))).toBe('Validation.General')
    expect(codeOf(() => createDiagnosis({ name: 'X', code: 'x'.repeat(21) }))).toBe(
      'Validation.General',
    )
  })

  it('updates without counting its own name or code as a duplicate', () => {
    updateDiagnosis('seed-diagnosis-01', { name: 'Sine morbi', code: 'D01' })
    expect(codeOf(() => updateDiagnosis('seed-diagnosis-01', { name: 'Cystitis' }))).toBe(
      'Diagnoses.NameNotUnique',
    )
    expect(codeOf(() => updateDiagnosis('missing', { name: 'X' }))).toBe('Diagnoses.NotFound')
  })

  it('retires and restores idempotently', () => {
    setDiagnosisActive('seed-diagnosis-02', false)
    setDiagnosisActive('seed-diagnosis-02', false)
    expect(names(ACTIVE)).not.toContain('Otitis externa')

    setDiagnosisActive('seed-diagnosis-02', true)
    setDiagnosisActive('seed-diagnosis-02', true)
    expect(names(ACTIVE)).toContain('Otitis externa')
  })

  it('imports new names and skips blanks, existing and too long ones', () => {
    const result = importDiagnoses([
      'Otitis media',
      '',
      '  ',
      'cystitis',
      'Vakcinacija',
      'x'.repeat(201),
      'Rhinitis',
    ])

    expect(result).toEqual({ added: 2, skipped: 3 })
    expect(names(ACTIVE)).toEqual(expect.arrayContaining(['Otitis media', 'Rhinitis']))
  })

  it('reads back what was saved after a reload', async () => {
    createDiagnosis({ name: 'Otitis media' })
    expect(window.localStorage.getItem(DIAGNOSES_STORAGE_KEY)).toContain('Otitis media')

    vi.resetModules()
    const reloaded = await import('./mockDiagnosesStore')

    expect(
      reloaded.listDiagnoses({ search: 'media', status: ACTIVE, page: 1, pageSize: 25 }).totalCount,
    ).toBe(1)
  })
})
