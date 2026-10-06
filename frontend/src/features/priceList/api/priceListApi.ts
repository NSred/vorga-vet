import { settle } from '@/shared/lib/mockApi'
import { toCatalogQuery } from '@/shared/domain/catalog'
import { toPriceListPage } from '../lib/priceListMapping'
import type {
  PriceListFilters,
  PriceListKind,
  PriceListPage,
  PriceListWriteRequest,
} from '../types'
import { createItem, listItems, setItemActive, updateItem } from './mockPriceListStore'

export async function getPriceListItems(
  kind: PriceListKind,
  filters: PriceListFilters,
  page: number,
  pageSize: number,
): Promise<PriceListPage> {
  await settle()
  return toPriceListPage(kind, listItems(kind, toCatalogQuery(filters, page, pageSize)))
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
