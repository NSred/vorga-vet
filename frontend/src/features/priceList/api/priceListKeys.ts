import type { PriceListFilters, PriceListKind } from '../types'

export const priceListKeys = {
  all: ['price-list'] as const,
  kind: (kind: PriceListKind) => [...priceListKeys.all, kind] as const,
  list: (kind: PriceListKind, filters: PriceListFilters, page: number, pageSize: number) =>
    [...priceListKeys.kind(kind), 'list', filters, page, pageSize] as const,
  charges: (examinationId: string) => [...priceListKeys.all, 'charges', examinationId] as const,
  exchangeRate: () => [...priceListKeys.all, 'exchange-rate'] as const,
}
