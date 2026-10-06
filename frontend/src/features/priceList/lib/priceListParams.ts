import {
  oneOf,
  parsePagedParams,
  writePagedParams,
  type PagedListSpec,
  type PagedView,
} from '@/shared/lib/listParams'
import type { PriceListKind, PriceListStatus } from '../types'

export interface ParsedPriceListParams extends PagedView<PriceListStatus> {
  kind: PriceListKind
}

const KIND_VALUES: PriceListKind[] = ['service', 'medication']
const DEFAULT_KIND: PriceListKind = 'service'

export const PRICE_LIST_PAGE_SIZES = [25, 50, 100]

const SPEC: PagedListSpec<PriceListStatus> = {
  statuses: ['active', 'all', 'retired'],
  defaultStatus: 'active',
  pageSizes: PRICE_LIST_PAGE_SIZES,
  defaultPageSize: 25,
}

export function parsePriceListParams(params: URLSearchParams): ParsedPriceListParams {
  return {
    kind: oneOf(params.get('kind'), KIND_VALUES) ?? DEFAULT_KIND,
    ...parsePagedParams(params, SPEC),
  }
}

export function toPriceListParams({ kind, ...view }: ParsedPriceListParams): URLSearchParams {
  const base = new URLSearchParams()
  if (kind !== DEFAULT_KIND) base.set('kind', kind)
  return writePagedParams(base, view, SPEC)
}
