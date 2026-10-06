import type { CatalogQueryDto } from '@/shared/domain/catalog'
import type { Page } from '@/shared/domain/page'
import { ApiError } from './apiClient'

const MOCK_DELAY_MS = import.meta.env.MODE === 'test' ? 0 : 150
const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 100
const STATUS_ACTIVE = 0
const STATUS_RETIRED = 2

export function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
}

export function failValidation(messages: string[]): never {
  throw new ApiError(400, 'One or more validation errors occurred.', 'Validation.General', messages)
}

export function assertValid(messages: string[]): void {
  if (messages.length > 0) failValidation(messages)
}

export function catalogPage<T extends { name: string; isActive: boolean }>(
  items: T[],
  query: CatalogQueryDto,
  matchesSearch: (item: T, term: string) => boolean,
): Page<T> {
  const page = query.page < 1 ? 1 : query.page
  const pageSize =
    query.pageSize < 1 || query.pageSize > MAX_PAGE_SIZE ? DEFAULT_PAGE_SIZE : query.pageSize
  const term = query.search?.trim().toLocaleLowerCase()

  const matching = items
    .filter((item) => {
      if (query.status === STATUS_ACTIVE) return item.isActive
      if (query.status === STATUS_RETIRED) return !item.isActive
      return true
    })
    .filter((item) => !term || matchesSearch(item, term))
    .sort((a, b) => a.name.localeCompare(b.name, 'sr'))

  return {
    items: matching.slice((page - 1) * pageSize, page * pageSize).map((item) => ({ ...item })),
    totalCount: matching.length,
    page,
    pageSize,
  }
}
