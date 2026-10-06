export interface Page<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
}

export function mapPage<T, R>(page: Page<T>, map: (item: T) => R): Page<R> {
  return { ...page, items: page.items.map(map) }
}
