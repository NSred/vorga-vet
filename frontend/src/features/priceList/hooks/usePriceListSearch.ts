import { useCallback } from 'react'
import { usePagedEntitySearch } from '@/shared/lib/useEntitySearch'
import { getPriceListItems } from '../api/priceListApi'
import { priceListKeys } from '../api/priceListKeys'
import type { PriceListKind } from '../types'

const PICKER_PAGE_SIZE = 15

export function usePriceListSearch(kind: PriceListKind) {
  const fetchPage = useCallback(
    (search: string, page: number) =>
      getPriceListItems(
        kind,
        { search: search.trim() || undefined, status: 'active' },
        page,
        PICKER_PAGE_SIZE,
      ),
    [kind],
  )

  return usePagedEntitySearch(priceListKeys.kind(kind), fetchPage)
}
