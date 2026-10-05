import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/lib/apiClient'
import {
  createItem,
  listItems,
  PRICE_LIST_STORAGE_KEY,
  resetPriceListStore,
  setItemActive,
  updateItem,
} from './mockPriceListStore'

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

beforeEach(() => {
  resetPriceListStore()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('mock price list store', () => {
  it('starts from the seed, active items only by default, sorted by name', () => {
    const page = listItems('service', { status: ACTIVE, page: 1, pageSize: 25 })

    expect(page.totalCount).toBe(12)
    expect(page.items.every((item) => item.isActive)).toBe(true)
    const names = page.items.map((item) => item.name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'sr')))
  })

  it('filters retired and all', () => {
    expect(listItems('medication', { status: RETIRED, page: 1, pageSize: 25 }).totalCount).toBe(2)
    expect(listItems('medication', { status: ALL, page: 1, pageSize: 25 }).totalCount).toBe(14)
  })

  it('searches the name case-insensitively', () => {
    const page = listItems('medication', { search: 'RABI', status: ALL, page: 1, pageSize: 25 })

    expect(page.items.map((item) => item.name)).toEqual([
      'Nobivac Rabies',
      'Rabigen Mono',
      'Rabisin',
    ])
  })

  it('pages and normalizes an out-of-range page size', () => {
    const second = listItems('service', { status: ALL, page: 2, pageSize: 10 })
    expect(second.items).toHaveLength(4)

    const normalized = listItems('service', { status: ALL, page: 0, pageSize: 500 })
    expect(normalized.page).toBe(1)
    expect(normalized.pageSize).toBe(25)
  })

  it('creates an item with a trimmed name and a unit only for medications', () => {
    const serviceId = createItem('service', { name: '  Sečenje kandži ', price: 300, unit: 'kom' })
    const medicationId = createItem('medication', { name: 'Drontal', price: 250, unit: ' tbl. ' })

    const service = listItems('service', {
      search: 'kandži',
      status: ACTIVE,
      page: 1,
      pageSize: 25,
    }).items[0]
    expect(service).toMatchObject({ id: serviceId, name: 'Sečenje kandži', price: 300 })
    expect(service.unit).toBeUndefined()

    const medication = listItems('medication', {
      search: 'Drontal',
      status: ACTIVE,
      page: 1,
      pageSize: 25,
    }).items[0]
    expect(medication).toMatchObject({ id: medicationId, unit: 'tbl.' })
  })

  it('refuses a duplicate name, including a retired one, in the same list only', () => {
    expect(codeOf(() => createItem('service', { name: 'klinički PREGLED', price: 1 }))).toBe(
      'Services.NameNotUnique',
    )
    expect(codeOf(() => createItem('service', { name: 'Tetoviranje', price: 1 }))).toBe(
      'Services.NameNotUnique',
    )
    expect(
      codeOf(() => createItem('medication', { name: 'Klinički pregled', price: 1 })),
    ).toBeUndefined()
  })

  it('validates name, price and unit', () => {
    const error = (() => {
      try {
        createItem('medication', { name: ' ', price: 10.555, unit: 'x'.repeat(21) })
      } catch (caught) {
        return caught as ApiError
      }
      return undefined
    })()

    expect(error?.code).toBe('Validation.General')
    expect(error?.validationMessages).toEqual([
      'Name is required.',
      'Price can have at most two decimals.',
      'Unit must be at most 20 characters.',
    ])
    expect(codeOf(() => createItem('service', { name: 'A', price: -1 }))).toBe('Validation.General')
  })

  it('updates an item without counting its own name as a duplicate', () => {
    updateItem('service', 'seed-service-01', { name: 'Klinički pregled', price: 1800 })

    const item = listItems('service', { search: 'Klinički', status: ALL, page: 1, pageSize: 25 })
      .items[0]
    expect(item.price).toBe(1800)
    expect(
      codeOf(() => updateItem('service', 'seed-service-01', { name: 'Obrada rane', price: 1 })),
    ).toBe('Services.NameNotUnique')
  })

  it('reports a missing item as not found', () => {
    expect(codeOf(() => updateItem('medication', 'missing', { name: 'X', price: 1 }))).toBe(
      'Medications.NotFound',
    )
    expect(codeOf(() => setItemActive('service', 'missing', false))).toBe('Services.NotFound')
  })

  it('retires and restores idempotently', () => {
    setItemActive('service', 'seed-service-01', false)
    setItemActive('service', 'seed-service-01', false)
    expect(listItems('service', { status: ACTIVE, page: 1, pageSize: 25 }).totalCount).toBe(11)

    setItemActive('service', 'seed-service-01', true)
    setItemActive('service', 'seed-service-01', true)
    expect(listItems('service', { status: ACTIVE, page: 1, pageSize: 25 }).totalCount).toBe(12)
  })

  it('returns copies, so callers cannot change the store', () => {
    const first = listItems('service', { status: ACTIVE, page: 1, pageSize: 25 }).items[0]
    first.name = 'changed'

    expect(listItems('service', { status: ACTIVE, page: 1, pageSize: 25 }).items[0].name).not.toBe(
      'changed',
    )
  })

  it('reads back what was saved after a reload', async () => {
    createItem('service', { name: 'Ultrazvuk', price: 3000 })
    expect(window.localStorage.getItem(PRICE_LIST_STORAGE_KEY)).toContain('Ultrazvuk')

    vi.resetModules()
    const reloaded = await import('./mockPriceListStore')

    const page = reloaded.listItems('service', {
      search: 'Ultrazvuk',
      status: ACTIVE,
      page: 1,
      pageSize: 25,
    })
    expect(page.totalCount).toBe(1)
  })

  it('falls back to the seed when the saved entry is unreadable', async () => {
    window.localStorage.setItem(PRICE_LIST_STORAGE_KEY, '{not json')

    vi.resetModules()
    const reloaded = await import('./mockPriceListStore')

    expect(reloaded.listItems('service', { status: ALL, page: 1, pageSize: 25 }).totalCount).toBe(
      14,
    )
  })

  it('keeps the change in memory when storage refuses writes', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })

    createItem('service', { name: 'Rendgen', price: 2500 })

    expect(
      listItems('service', { search: 'Rendgen', status: ACTIVE, page: 1, pageSize: 25 }).totalCount,
    ).toBe(1)
  })

  it('marks the seeded vaccines and upgrades a saved version 1 list in place', async () => {
    const vaccines = listItems('medication', { status: ALL, page: 1, pageSize: 25 })
      .items.filter((item) => item.isVaccine)
      .map((item) => [item.name, item.isRabies, item.validityDays])
    expect(vaccines).toEqual([
      ['Canigen DHPPi/L', false, 365],
      ['Feligen CRP', false, 365],
      ['Nobivac Rabies', true, 365],
      ['Rabigen Mono', true, 365],
      ['Rabisin', true, 365],
      ['Vanguard Plus 7', false, 365],
    ])

    window.localStorage.setItem(
      PRICE_LIST_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        service: [],
        medication: [
          {
            id: 'seed-medication-01',
            name: 'Nobivac Rabies',
            price: 950,
            unit: 'kom',
            isActive: true,
            createdAt: 'x',
          },
          { id: 'mine', name: 'Moj lek', price: 10, unit: null, isActive: true, createdAt: 'x' },
        ],
      }),
    )
    vi.resetModules()
    const reloaded = await import('./mockPriceListStore')
    const upgraded = reloaded.listItems('medication', { status: ALL, page: 1, pageSize: 25 }).items

    expect(upgraded.find((item) => item.id === 'seed-medication-01')).toMatchObject({
      price: 950,
      isVaccine: true,
      isRabies: true,
    })
    expect(upgraded.find((item) => item.id === 'mine')?.isVaccine).toBeUndefined()
  })

  it('refuses a rabies mark without a vaccine and a bad duration', () => {
    expect(codeOf(() => createItem('medication', { name: 'X', price: 1, isRabies: true }))).toBe(
      'Validation.General',
    )
    expect(
      codeOf(() =>
        createItem('medication', { name: 'Y', price: 1, isVaccine: true, validityDays: 0 }),
      ),
    ).toBe('Validation.General')
  })
})
