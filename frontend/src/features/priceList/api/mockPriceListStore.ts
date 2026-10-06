import { ApiError } from '@/shared/lib/apiClient'
import { MAX_AMOUNT } from '@/shared/lib/money'
import { assertValid, catalogPage } from '@/shared/lib/mockApi'
import { createMockStore, newId } from '@/shared/lib/mockStore'
import {
  hasAtMostTwoDecimals,
  sameText,
  trimmedLength,
  trimmedOrNull,
} from '@/shared/lib/validation'
import type {
  PriceListItemDto,
  PriceListKind,
  PriceListPageDto,
  PriceListQueryDto,
  PriceListWriteRequest,
} from '../types'
import { nameNotUniqueCode, notFoundCode } from './priceListErrors'

export const PRICE_LIST_STORAGE_KEY = 'vorgavet.mock.priceList'

const DEFAULT_VALIDITY_DAYS = 365
const MAX_VALIDITY_DAYS = 3650
const MAX_NAME_LENGTH = 200
const MAX_UNIT_LENGTH = 20
const SEEDED_AT = '2026-10-05T08:00:00.000Z'

type Lists = Record<PriceListKind, PriceListItemDto[]>

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

const store = createMockStore<Lists>({
  key: PRICE_LIST_STORAGE_KEY,
  version: 2,
  isValid: (value) => Array.isArray(value.service) && Array.isArray(value.medication),
  initial: () => ({
    service: seedItems('service', SERVICE_SEED),
    medication: seedItems('medication', MEDICATION_SEED),
  }),
  upgrade: (value) => {
    if (value.version !== 1) return null
    const lists = value as unknown as Lists
    return { ...lists, medication: lists.medication.map(withSeedVaccineMarks) }
  },
})

export const resetPriceListStore = store.reset

function validate(kind: PriceListKind, request: PriceListWriteRequest): void {
  const messages: string[] = []
  const name = request.name?.trim() ?? ''

  if (!name) messages.push('Name is required.')
  else if (name.length > MAX_NAME_LENGTH)
    messages.push(`Name must be at most ${MAX_NAME_LENGTH} characters.`)

  if (typeof request.price !== 'number' || !Number.isFinite(request.price)) {
    messages.push('Price is required.')
  } else if (request.price < 0) {
    messages.push('Price must be 0 or more.')
  } else if (request.price > MAX_AMOUNT) {
    messages.push('Price is too large.')
  } else if (!hasAtMostTwoDecimals(request.price)) {
    messages.push('Price can have at most two decimals.')
  }

  if (kind === 'medication' && trimmedLength(request.unit) > MAX_UNIT_LENGTH) {
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

  assertValid(messages)
}

function assertUniqueName(kind: PriceListKind, name: string, exceptId?: string): void {
  const taken = store
    .state()
    [kind].some((item) => item.id !== exceptId && sameText(item.name, name))
  if (taken) {
    throw new ApiError(
      409,
      'An item with this name is already on the price list.',
      nameNotUniqueCode(kind),
    )
  }
}

function findItem(kind: PriceListKind, id: string): PriceListItemDto {
  const item = store.state()[kind].find((candidate) => candidate.id === id)
  if (!item) {
    throw new ApiError(404, 'The price list item was not found.', notFoundCode(kind))
  }
  return item
}

function unitOf(kind: PriceListKind, unit: string | null | undefined): string | null | undefined {
  return kind === 'medication' ? trimmedOrNull(unit) : undefined
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

export function listItems(kind: PriceListKind, query: PriceListQueryDto): PriceListPageDto {
  return catalogPage(store.state()[kind], query, (item, term) =>
    item.name.toLocaleLowerCase().includes(term),
  )
}

export function createItem(kind: PriceListKind, request: PriceListWriteRequest): string {
  validate(kind, request)
  const name = request.name.trim()
  assertUniqueName(kind, name)

  const item: PriceListItemDto = {
    id: newId('item'),
    name,
    price: request.price,
    unit: unitOf(kind, request.unit),
    ...vaccineFieldsOf(kind, request),
    isActive: true,
    createdAt: new Date().toISOString(),
  }

  store.state()[kind].push(item)
  store.commit()

  return item.id
}

export function updateItem(kind: PriceListKind, id: string, request: PriceListWriteRequest): void {
  const item = findItem(kind, id)
  validate(kind, request)
  const name = request.name.trim()
  assertUniqueName(kind, name, id)

  item.name = name
  item.price = request.price
  item.unit = unitOf(kind, request.unit)
  Object.assign(item, vaccineFieldsOf(kind, request))
  store.commit()
}

export function setItemActive(kind: PriceListKind, id: string, isActive: boolean): void {
  const item = findItem(kind, id)
  if (item.isActive === isActive) return

  item.isActive = isActive
  store.commit()
}
