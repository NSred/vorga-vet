import type { PriceListFilters, PriceListKind, PriceListStatus } from '../types'

export interface ParsedPriceListParams {
  kind: PriceListKind
  filters: PriceListFilters
  page: number
  pageSize: number
}

const KIND_VALUES: PriceListKind[] = ['service', 'medication']
const STATUS_VALUES: PriceListStatus[] = ['active', 'all', 'retired']
const PAGE_SIZES = [25, 50, 100]

export const PRICE_LIST_PAGE_SIZES = PAGE_SIZES

const DEFAULT_KIND: PriceListKind = 'service'
const DEFAULT_STATUS: PriceListStatus = 'active'
const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 25

function oneOf<T extends string>(value: string | null, allowed: T[]): T | undefined {
  return value !== null && (allowed as string[]).includes(value) ? (value as T) : undefined
}

function positiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function parsePriceListParams(params: URLSearchParams): ParsedPriceListParams {
  const pageSize = positiveInt(params.get('pageSize'), DEFAULT_PAGE_SIZE)
  const filters: PriceListFilters = {
    status: oneOf(params.get('status'), STATUS_VALUES) ?? DEFAULT_STATUS,
  }

  const search = params.get('search')?.trim()
  if (search) filters.search = search

  return {
    kind: oneOf(params.get('kind'), KIND_VALUES) ?? DEFAULT_KIND,
    filters,
    page: positiveInt(params.get('page'), DEFAULT_PAGE),
    pageSize: PAGE_SIZES.includes(pageSize) ? pageSize : DEFAULT_PAGE_SIZE,
  }
}

export function toPriceListParams({
  kind,
  filters,
  page,
  pageSize,
}: ParsedPriceListParams): URLSearchParams {
  const params = new URLSearchParams()

  if (kind !== DEFAULT_KIND) params.set('kind', kind)
  if (filters.search) params.set('search', filters.search)
  if (filters.status !== DEFAULT_STATUS) params.set('status', filters.status)
  if (page !== DEFAULT_PAGE) params.set('page', String(page))
  if (pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(pageSize))

  return params
}
