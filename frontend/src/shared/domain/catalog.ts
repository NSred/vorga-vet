export type CatalogStatus = 'active' | 'all' | 'retired'

export interface CatalogFilters {
  search?: string
  status: CatalogStatus
}

export interface CatalogQueryDto {
  search?: string
  status: number
  page: number
  pageSize: number
}

const STATUS_TO_API: Record<CatalogStatus, number> = { active: 0, all: 1, retired: 2 }

export function catalogStatusToApi(status: CatalogStatus): number {
  return STATUS_TO_API[status]
}

export function toCatalogQuery(
  filters: CatalogFilters,
  page: number,
  pageSize: number,
): CatalogQueryDto {
  const query: CatalogQueryDto = { status: catalogStatusToApi(filters.status), page, pageSize }
  const search = filters.search?.trim()
  if (search) query.search = search
  return query
}
