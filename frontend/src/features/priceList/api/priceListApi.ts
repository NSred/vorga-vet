import { statusToApi, toPriceListPage } from '../lib/priceListMapping'
import type {
  PriceListFilters,
  PriceListKind,
  PriceListPage,
  PriceListQueryDto,
  PriceListWriteRequest,
} from '../types'
import { createItem, listItems, setItemActive, updateItem } from './mockPriceListStore'

const MOCK_DELAY_MS = import.meta.env.MODE === 'test' ? 0 : 150

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
}

export function buildPriceListQuery(
  filters: PriceListFilters,
  page: number,
  pageSize: number,
): PriceListQueryDto {
  const query: PriceListQueryDto = { status: statusToApi(filters.status), page, pageSize }
  const search = filters.search?.trim()
  if (search) query.search = search
  return query
}

export async function getPriceListItems(
  kind: PriceListKind,
  filters: PriceListFilters,
  page: number,
  pageSize: number,
): Promise<PriceListPage> {
  await settle()
  return toPriceListPage(kind, listItems(kind, buildPriceListQuery(filters, page, pageSize)))
}

export async function createPriceListItem(
  kind: PriceListKind,
  request: PriceListWriteRequest,
): Promise<string> {
  await settle()
  return createItem(kind, request)
}

export async function updatePriceListItem(
  kind: PriceListKind,
  id: string,
  request: PriceListWriteRequest,
): Promise<void> {
  await settle()
  updateItem(kind, id, request)
}

export async function retirePriceListItem(kind: PriceListKind, id: string): Promise<void> {
  await settle()
  setItemActive(kind, id, false)
}

export async function restorePriceListItem(kind: PriceListKind, id: string): Promise<void> {
  await settle()
  setItemActive(kind, id, true)
}
