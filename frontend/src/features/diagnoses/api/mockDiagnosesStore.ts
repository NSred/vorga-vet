import { ApiError } from '@/shared/lib/apiClient'
import type {
  DiagnosisDto,
  DiagnosisImportResult,
  DiagnosisPageDto,
  DiagnosisQueryDto,
  DiagnosisWriteRequest,
} from '../types'
import { diagnosisErrors } from './diagnosisErrors'

export const DIAGNOSES_STORAGE_KEY = 'vorgavet.mock.diagnoses'

const STORE_VERSION = 1
const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100
const MAX_NAME_LENGTH = 200
const MAX_CODE_LENGTH = 20
const STATUS_ACTIVE = 0
const STATUS_RETIRED = 2
const SEEDED_AT = '2026-10-05T08:00:00.000Z'

interface StoreState {
  version: number
  items: DiagnosisDto[]
}

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

let state: StoreState | null = null

function seed(): StoreState {
  return {
    version: STORE_VERSION,
    items: SEED.map(([name, code, retired], index) => ({
      id: `seed-diagnosis-${String(index + 1).padStart(2, '0')}`,
      code: code ?? null,
      name,
      isActive: !retired,
      createdAt: SEEDED_AT,
    })),
  }
}

function isStoreState(value: unknown): value is StoreState {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<StoreState>
  return candidate.version === STORE_VERSION && Array.isArray(candidate.items)
}

function readStorage(): StoreState | null {
  try {
    const raw = window.localStorage.getItem(DIAGNOSES_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isStoreState(parsed) ? parsed : null
  } catch {
    return null
  }
}

function load(): StoreState {
  state ??= readStorage() ?? seed()
  return state
}

function commit(): void {
  if (!state) return
  try {
    window.localStorage.setItem(DIAGNOSES_STORAGE_KEY, JSON.stringify(state))
  } catch {
    return
  }
}

export function resetDiagnosesStore(): void {
  state = null
  try {
    window.localStorage.removeItem(DIAGNOSES_STORAGE_KEY)
  } catch {
    return
  }
}

function normalize(text: string): string {
  return text.trim().toLocaleLowerCase()
}

function codeOf(code: string | null | undefined): string | null {
  const trimmed = code?.trim()
  return trimmed ? trimmed : null
}

function validate(request: DiagnosisWriteRequest): void {
  const messages: string[] = []
  const name = request.name?.trim() ?? ''
  if (!name) messages.push('Name is required.')
  else if (name.length > MAX_NAME_LENGTH)
    messages.push(`Name must be at most ${MAX_NAME_LENGTH} characters.`)
  if ((codeOf(request.code)?.length ?? 0) > MAX_CODE_LENGTH) {
    messages.push(`Code must be at most ${MAX_CODE_LENGTH} characters.`)
  }
  if (messages.length > 0) {
    throw new ApiError(
      400,
      'One or more validation errors occurred.',
      diagnosisErrors.validation,
      messages,
    )
  }
}

function nameTaken(name: string, exceptId?: string): boolean {
  const normalized = normalize(name)
  return load().items.some((item) => item.id !== exceptId && normalize(item.name) === normalized)
}

function assertUnique(name: string, code: string | null, exceptId?: string): void {
  if (nameTaken(name, exceptId)) {
    throw new ApiError(409, 'This diagnosis is already on the list.', diagnosisErrors.nameNotUnique)
  }
  if (
    code &&
    load().items.some(
      (item) => item.id !== exceptId && item.code && normalize(item.code) === normalize(code),
    )
  ) {
    throw new ApiError(
      409,
      'Another diagnosis already uses this code.',
      diagnosisErrors.codeNotUnique,
    )
  }
}

function find(id: string): DiagnosisDto {
  const item = load().items.find((candidate) => candidate.id === id)
  if (!item) throw new ApiError(404, 'The diagnosis was not found.', diagnosisErrors.notFound)
  return item
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `diagnosis-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function listDiagnoses(query: DiagnosisQueryDto): DiagnosisPageDto {
  const page = query.page < 1 ? 1 : query.page
  const pageSize =
    query.pageSize < 1 || query.pageSize > MAX_PAGE_SIZE ? DEFAULT_PAGE_SIZE : query.pageSize
  const term = query.search?.trim().toLocaleLowerCase()

  const matching = load()
    .items.filter((item) => {
      if (query.status === STATUS_ACTIVE) return item.isActive
      if (query.status === STATUS_RETIRED) return !item.isActive
      return true
    })
    .filter(
      (item) =>
        !term ||
        item.name.toLocaleLowerCase().includes(term) ||
        (item.code?.toLocaleLowerCase().includes(term) ?? false),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'sr'))

  return {
    items: matching.slice((page - 1) * pageSize, page * pageSize).map((item) => ({ ...item })),
    totalCount: matching.length,
    page,
    pageSize,
  }
}

export function createDiagnosis(request: DiagnosisWriteRequest): string {
  validate(request)
  const name = request.name.trim()
  const code = codeOf(request.code)
  assertUnique(name, code)

  const item: DiagnosisDto = {
    id: newId(),
    code,
    name,
    isActive: true,
    createdAt: new Date().toISOString(),
  }
  load().items.push(item)
  commit()
  return item.id
}

export function updateDiagnosis(id: string, request: DiagnosisWriteRequest): void {
  const item = find(id)
  validate(request)
  const name = request.name.trim()
  const code = codeOf(request.code)
  assertUnique(name, code, id)

  item.name = name
  item.code = code
  commit()
}

export function setDiagnosisActive(id: string, isActive: boolean): void {
  const item = find(id)
  if (item.isActive === isActive) return
  item.isActive = isActive
  commit()
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
    load().items.push({
      id: newId(),
      code: null,
      name,
      isActive: true,
      createdAt: new Date().toISOString(),
    })
    added += 1
  }

  if (added > 0) commit()
  return { added, skipped }
}
