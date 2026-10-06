export function oneOf<T extends string>(
  value: string | null,
  allowed: readonly T[],
): T | undefined {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : undefined
}

export function positiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function trimmedParam(value: string | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export interface PagedListSpec<S extends string> {
  statuses: readonly S[]
  defaultStatus: S
  pageSizes: readonly number[]
  defaultPageSize: number
}

export interface PagedView<S extends string> {
  filters: { search?: string; status: S }
  page: number
  pageSize: number
}

const DEFAULT_PAGE = 1

export function parsePagedParams<S extends string>(
  params: URLSearchParams,
  spec: PagedListSpec<S>,
): PagedView<S> {
  const filters: PagedView<S>['filters'] = {
    status: oneOf(params.get('status'), spec.statuses) ?? spec.defaultStatus,
  }
  const search = trimmedParam(params.get('search'))
  if (search) filters.search = search

  const pageSize = positiveInt(params.get('pageSize'), spec.defaultPageSize)
  return {
    filters,
    page: positiveInt(params.get('page'), DEFAULT_PAGE),
    pageSize: spec.pageSizes.includes(pageSize) ? pageSize : spec.defaultPageSize,
  }
}

export function writePagedParams<S extends string>(
  base: URLSearchParams,
  { filters, page, pageSize }: PagedView<S>,
  spec: PagedListSpec<S>,
  extra: Record<string, string | undefined> = {},
): URLSearchParams {
  const params = new URLSearchParams(base)
  for (const key of ['search', ...Object.keys(extra), 'status', 'page', 'pageSize']) {
    params.delete(key)
  }

  if (filters.search) params.set('search', filters.search)
  for (const [key, value] of Object.entries(extra)) {
    if (value) params.set(key, value)
  }
  if (filters.status !== spec.defaultStatus) params.set('status', filters.status)
  if (page !== DEFAULT_PAGE) params.set('page', String(page))
  if (pageSize !== spec.defaultPageSize) params.set('pageSize', String(pageSize))

  return params
}
