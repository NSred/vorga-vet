import { ApiError } from '@/shared/lib/apiClient'
import type {
  PriceListItemDto,
  PriceListKind,
  PriceListPageDto,
  PriceListQueryDto,
  PriceListWriteRequest,
} from '../types'
import { nameNotUniqueCode, notFoundCode, priceListErrors } from './priceListErrors'

export const PRICE_LIST_STORAGE_KEY = 'vorgavet.mock.priceList'

const STORE_VERSION = 2
const DEFAULT_VALIDITY_DAYS = 365
const MAX_VALIDITY_DAYS = 3650
const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100
const MAX_NAME_LENGTH = 200
const MAX_UNIT_LENGTH = 20
const MAX_PRICE = 99_999_999.99
const STATUS_ACTIVE = 0
const STATUS_RETIRED = 2
const SEEDED_AT = '2026-10-05T08:00:00.000Z'

interface StoreState {
  version: number
  service: PriceListItemDto[]
  medication: PriceListItemDto[]
}

type SeedRow = [name: string, price: number, unit?: string, retired?: boolean]

const SERVICE_SEED: SeedRow[] = [
  ['Klinički pregled', 1500],
  ['Kontrolni pregled', 800],
  ['Vakcinacija protiv besnila', 2500],
  ['Vakcinacija (kombinovana)', 2200],
  ['Dehelmintizacija', 600],
  ['Ugradnja mikročipa', 2000],
  ['Ceđenje perianalnih žlezda', 700],
  ['Obrada rane', 1200],
  ['Aplikacija infuzije', 1000],
  ['Potvrda o zdravstvenom stanju', 700],
  ['Sterilizacija mačke', 9000],
  ['Kastracija mačka', 6000],
  ['Tetoviranje', 1000, undefined, true],
  ['Obeležavanje markicom', 500, undefined, true],
]

const MEDICATION_SEED: SeedRow[] = [
  ['Nobivac Rabies', 900, 'kom'],
  ['Rabigen Mono', 800, 'kom'],
  ['Vanguard Plus 7', 1400, 'kom'],
  ['Canigen DHPPi/L', 1300, 'kom'],
  ['Feligen CRP', 1500, 'kom'],
  ['NexGard Spectra', 2300, 'kom'],
  ['Milprazon', 450, 'tbl.'],
  ['Advantix', 1200, 'kom'],
  ['Synulox', 150, 'tbl.'],
  ['Dexa 0,2', 80, 'ml'],
  ['Ivermectin sol.', 60, 'ml'],
  ['Otifree', 1600, 'boca'],
  ['Rabisin', 900, 'kom', true],
  ['Banminth pasta', 500, 'tuba', true],
]

const VACCINES: Record<string, { isRabies: boolean }> = {
  'Nobivac Rabies': { isRabies: true },
  'Rabigen Mono': { isRabies: true },
  'Vanguard Plus 7': { isRabies: false },
  'Canigen DHPPi/L': { isRabies: false },
  'Feligen CRP': { isRabies: false },
  Rabisin: { isRabies: true },
}

let state: StoreState | null = null

function withSeedVaccineMarks(item: PriceListItemDto): PriceListItemDto {
  const vaccine = item.id.startsWith('seed-medication-') ? VACCINES[item.name] : undefined
  if (!vaccine || item.isVaccine !== undefined) return item
  return {
    ...item,
    isVaccine: true,
    isRabies: vaccine.isRabies,
    validityDays: DEFAULT_VALIDITY_DAYS,
  }
}

function seedItems(kind: PriceListKind, rows: SeedRow[]): PriceListItemDto[] {
  return rows
    .map(([name, price, unit, retired], index) => ({
      id: `seed-${kind}-${String(index + 1).padStart(2, '0')}`,
      name,
      price,
      unit: kind === 'medication' ? (unit ?? null) : undefined,
      isActive: !retired,
      createdAt: SEEDED_AT,
    }))
    .map(withSeedVaccineMarks)
}

function seed(): StoreState {
  return {
    version: STORE_VERSION,
    service: seedItems('service', SERVICE_SEED),
    medication: seedItems('medication', MEDICATION_SEED),
  }
}

function hasLists(value: unknown): value is StoreState {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<StoreState>
  return Array.isArray(candidate.service) && Array.isArray(candidate.medication)
}

function upgrade(value: unknown): StoreState | null {
  if (!hasLists(value)) return null
  if (value.version === STORE_VERSION) return value
  if (value.version === 1) {
    return {
      ...value,
      version: STORE_VERSION,
      medication: value.medication.map(withSeedVaccineMarks),
    }
  }
  return null
}

function readStorage(): StoreState | null {
  try {
    const raw = window.localStorage.getItem(PRICE_LIST_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return upgrade(parsed)
  } catch {
    return null
  }
}

function writeStorage(current: StoreState): void {
  try {
    window.localStorage.setItem(PRICE_LIST_STORAGE_KEY, JSON.stringify(current))
  } catch {
    return
  }
}

function load(): StoreState {
  state ??= readStorage() ?? seed()
  return state
}

function commit(): void {
  if (state) writeStorage(state)
}

export function resetPriceListStore(): void {
  state = null
  try {
    window.localStorage.removeItem(PRICE_LIST_STORAGE_KEY)
  } catch {
    return
  }
}

function copy(item: PriceListItemDto): PriceListItemDto {
  return { ...item }
}

function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase()
}

function hasAtMostTwoDecimals(value: number): boolean {
  const cents = value * 100
  return Math.abs(cents - Math.round(cents)) < 1e-6
}

function validate(kind: PriceListKind, request: PriceListWriteRequest): string[] {
  const messages: string[] = []
  const name = request.name?.trim() ?? ''

  if (!name) messages.push('Name is required.')
  else if (name.length > MAX_NAME_LENGTH)
    messages.push(`Name must be at most ${MAX_NAME_LENGTH} characters.`)

  if (typeof request.price !== 'number' || !Number.isFinite(request.price)) {
    messages.push('Price is required.')
  } else if (request.price < 0) {
    messages.push('Price must be 0 or more.')
  } else if (request.price > MAX_PRICE) {
    messages.push('Price is too large.')
  } else if (!hasAtMostTwoDecimals(request.price)) {
    messages.push('Price can have at most two decimals.')
  }

  if (kind === 'medication' && (request.unit?.trim().length ?? 0) > MAX_UNIT_LENGTH) {
    messages.push(`Unit must be at most ${MAX_UNIT_LENGTH} characters.`)
  }

  if (request.isRabies && !request.isVaccine) {
    messages.push('Only a vaccine can be a rabies vaccine.')
  }
  if (kind === 'medication' && request.isVaccine) {
    const days = request.validityDays
    if (
      typeof days !== 'number' ||
      !Number.isInteger(days) ||
      days < 1 ||
      days > MAX_VALIDITY_DAYS
    ) {
      messages.push(`A vaccine lasts 1 to ${MAX_VALIDITY_DAYS} days.`)
    }
  }

  return messages
}

function assertValid(kind: PriceListKind, request: PriceListWriteRequest): void {
  const messages = validate(kind, request)
  if (messages.length > 0) {
    throw new ApiError(
      400,
      'One or more validation errors occurred.',
      priceListErrors.validation,
      messages,
    )
  }
}

function assertUniqueName(kind: PriceListKind, name: string, exceptId?: string): void {
  const normalized = normalizeName(name)
  const taken = load()[kind].some(
    (item) => item.id !== exceptId && normalizeName(item.name) === normalized,
  )
  if (taken) {
    throw new ApiError(
      409,
      'An item with this name is already on the price list.',
      nameNotUniqueCode(kind),
    )
  }
}

function findItem(kind: PriceListKind, id: string): PriceListItemDto {
  const item = load()[kind].find((candidate) => candidate.id === id)
  if (!item) {
    throw new ApiError(404, 'The price list item was not found.', notFoundCode(kind))
  }
  return item
}

function unitOf(kind: PriceListKind, unit: string | null | undefined): string | null | undefined {
  if (kind !== 'medication') return undefined
  const trimmed = unit?.trim()
  return trimmed ? trimmed : null
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `item-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function listItems(kind: PriceListKind, query: PriceListQueryDto): PriceListPageDto {
  const page = query.page < 1 ? 1 : query.page
  const pageSize =
    query.pageSize < 1 || query.pageSize > MAX_PAGE_SIZE ? DEFAULT_PAGE_SIZE : query.pageSize
  const term = query.search?.trim().toLocaleLowerCase()

  const matching = load()
    [kind].filter((item) => {
      if (query.status === STATUS_ACTIVE) return item.isActive
      if (query.status === STATUS_RETIRED) return !item.isActive
      return true
    })
    .filter((item) => !term || item.name.toLocaleLowerCase().includes(term))
    .sort((a, b) => a.name.localeCompare(b.name, 'sr'))

  return {
    items: matching.slice((page - 1) * pageSize, page * pageSize).map(copy),
    totalCount: matching.length,
    page,
    pageSize,
  }
}

function vaccineFieldsOf(
  kind: PriceListKind,
  request: PriceListWriteRequest,
): Pick<PriceListItemDto, 'isVaccine' | 'isRabies' | 'validityDays'> {
  if (kind !== 'medication') return {}
  const isVaccine = Boolean(request.isVaccine)
  return {
    isVaccine,
    isRabies: isVaccine && Boolean(request.isRabies),
    validityDays: isVaccine ? (request.validityDays ?? DEFAULT_VALIDITY_DAYS) : null,
  }
}

export function createItem(kind: PriceListKind, request: PriceListWriteRequest): string {
  assertValid(kind, request)
  const name = request.name.trim()
  assertUniqueName(kind, name)

  const item: PriceListItemDto = {
    id: newId(),
    name,
    price: request.price,
    unit: unitOf(kind, request.unit),
    ...vaccineFieldsOf(kind, request),
    isActive: true,
    createdAt: new Date().toISOString(),
  }

  load()[kind].push(item)
  commit()

  return item.id
}

export function updateItem(kind: PriceListKind, id: string, request: PriceListWriteRequest): void {
  const item = findItem(kind, id)
  assertValid(kind, request)
  const name = request.name.trim()
  assertUniqueName(kind, name, id)

  item.name = name
  item.price = request.price
  item.unit = unitOf(kind, request.unit)
  Object.assign(item, vaccineFieldsOf(kind, request))
  commit()
}

export function setItemActive(kind: PriceListKind, id: string, isActive: boolean): void {
  const item = findItem(kind, id)
  if (item.isActive === isActive) return

  item.isActive = isActive
  commit()
}
