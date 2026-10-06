import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getPriceListItems } from '../api/priceListApi'
import { priceListKeys } from '../api/priceListKeys'
import type { PriceListFilters, PriceListKind } from '../types'

export function usePriceListQuery(
  kind: PriceListKind,
  filters: PriceListFilters,
  page: number,
  pageSize: number,
) {
  return useQuery({
    queryKey: priceListKeys.list(kind, filters, page, pageSize),
    queryFn: () => getPriceListItems(kind, filters, page, pageSize),
    placeholderData: keepPreviousData,
    meta: { errorTitle: 'Could not load the price list' },
  })
}
