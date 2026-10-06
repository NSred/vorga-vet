import { ApiError } from '@/shared/lib/apiClient'
import { assertValid, catalogPage } from '@/shared/lib/mockApi'
import { createMockStore, newId } from '@/shared/lib/mockStore'
import { sameText, trimmedOrNull } from '@/shared/lib/validation'
import type {
  DiagnosisDto,
  DiagnosisImportResult,
  DiagnosisPageDto,
  DiagnosisQueryDto,
  DiagnosisWriteRequest,
} from '../types'
import { diagnosisErrors } from './diagnosisErrors'

export const DIAGNOSES_STORAGE_KEY = 'vorgavet.mock.diagnoses'

const MAX_NAME_LENGTH = 200
const MAX_CODE_LENGTH = 20
const SEEDED_AT = '2026-10-05T08:00:00.000Z'

type SeedRow = [name: string, code?: string, retired?: boolean]

const SEED: SeedRow[] = [
  ['Sine morbi', 'D01'],
  ['Otitis externa', 'D02'],
  ['Dermatitis allergica', 'D03'],
  ['Gastroenteritis acuta', 'D04'],
  ['Bursitis ac. bilateralis', 'D05'],
  ['Dirofilariosis (heartworm disease)'],
  ['Conjunctivitis'],
  ['Parvovirosis'],
  ['Babesiosis'],
  ['Cystitis'],
  ['Insufficientia renalis chronica'],
  ['Calculus dentalis'],
  ['Pyometra'],
  ['Obesitas'],
  ['In observatione'],
  ['Vakcinacija', undefined, true],
  ['Dehelmintizacija', undefined, true],
]

const store = createMockStore<{ items: DiagnosisDto[] }>({
  key: DIAGNOSES_STORAGE_KEY,
  version: 1,
  isValid: (value) => Array.isArray(value.items),
  initial: () => ({
    items: SEED.map(([name, code, retired], index) => ({
      id: `seed-diagnosis-${String(index + 1).padStart(2, '0')}`,
      code: code ?? null,
      name,
      isActive: !retired,
      createdAt: SEEDED_AT,
    })),
  }),
})

export const resetDiagnosesStore = store.reset

function items(): DiagnosisDto[] {
  return store.state().items
}

function validate(request: DiagnosisWriteRequest): void {
  const messages: string[] = []
  const name = request.name?.trim() ?? ''
  if (!name) messages.push('Name is required.')
  else if (name.length > MAX_NAME_LENGTH)
    messages.push(`Name must be at most ${MAX_NAME_LENGTH} characters.`)
  if ((trimmedOrNull(request.code)?.length ?? 0) > MAX_CODE_LENGTH) {
    messages.push(`Code must be at most ${MAX_CODE_LENGTH} characters.`)
  }
  assertValid(messages)
}

function nameTaken(name: string, exceptId?: string): boolean {
  return items().some((item) => item.id !== exceptId && sameText(item.name, name))
}

function assertUnique(name: string, code: string | null, exceptId?: string): void {
  if (nameTaken(name, exceptId)) {
    throw new ApiError(409, 'This diagnosis is already on the list.', diagnosisErrors.nameNotUnique)
  }
  if (
    code &&
    items().some((item) => item.id !== exceptId && item.code && sameText(item.code, code))
  ) {
    throw new ApiError(
      409,
      'Another diagnosis already uses this code.',
      diagnosisErrors.codeNotUnique,
    )
  }
}

function find(id: string): DiagnosisDto {
  const item = items().find((candidate) => candidate.id === id)
  if (!item) throw new ApiError(404, 'The diagnosis was not found.', diagnosisErrors.notFound)
  return item
}

function newDiagnosis(name: string, code: string | null): DiagnosisDto {
  return { id: newId('diagnosis'), code, name, isActive: true, createdAt: new Date().toISOString() }
}

export function listDiagnoses(query: DiagnosisQueryDto): DiagnosisPageDto {
  return catalogPage(
    items(),
    query,
    (item, term) =>
      item.name.toLocaleLowerCase().includes(term) ||
      (item.code?.toLocaleLowerCase().includes(term) ?? false),
  )
}

export function createDiagnosis(request: DiagnosisWriteRequest): string {
  validate(request)
  const name = request.name.trim()
  const code = trimmedOrNull(request.code)
  assertUnique(name, code)

  const item = newDiagnosis(name, code)
  items().push(item)
  store.commit()
  return item.id
}

export function updateDiagnosis(id: string, request: DiagnosisWriteRequest): void {
  const item = find(id)
  validate(request)
  const name = request.name.trim()
  const code = trimmedOrNull(request.code)
  assertUnique(name, code, id)

  item.name = name
  item.code = code
  store.commit()
}

export function setDiagnosisActive(id: string, isActive: boolean): void {
  const item = find(id)
  if (item.isActive === isActive) return
  item.isActive = isActive
  store.commit()
}

export function importDiagnoses(names: string[]): DiagnosisImportResult {
  let added = 0
  let skipped = 0

  for (const raw of names) {
    const name = raw.trim()
    if (!name) continue
    if (name.length > MAX_NAME_LENGTH || nameTaken(name)) {
      skipped += 1
      continue
    }
    items().push(newDiagnosis(name, null))
    added += 1
  }

  if (added > 0) store.commit()
  return { added, skipped }
}
