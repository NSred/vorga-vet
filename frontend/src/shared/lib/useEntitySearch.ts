import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'

export interface EntitySearchState<T> {
  query: string
  setQuery: (query: string) => void
  results: T[]
  isLoading: boolean
  errorMessage?: string
  activate: () => void
}

export interface SearchPage<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
}

export interface PagedEntitySearchState<T> extends EntitySearchState<T> {
  hasMore: boolean
  isLoadingMore: boolean
  loadMore: () => void
}

function useSearchInput() {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(false)
  const debouncedQuery = useDebouncedValue(query, 300)
  const activate = useCallback(() => setActive(true), [])
  return { query, setQuery, debouncedQuery, active, activate }
}

export function useEntitySearch<T>(
  queryKeyPrefix: readonly unknown[],
  fetcher: (search: string) => Promise<T[]>,
): EntitySearchState<T> {
  const { query, setQuery, debouncedQuery, active, activate } = useSearchInput()

  const { data, isFetching, error } = useQuery({
    queryKey: [...queryKeyPrefix, 'search', debouncedQuery],
    queryFn: () => fetcher(debouncedQuery),
    enabled: active,
  })

  return {
    query,
    setQuery,
    results: data ?? [],
    isLoading: isFetching,
    errorMessage: error instanceof Error ? error.message : undefined,
    activate,
  }
}

export function usePagedEntitySearch<T>(
  queryKeyPrefix: readonly unknown[],
  fetchPage: (search: string, page: number) => Promise<SearchPage<T>>,
): PagedEntitySearchState<T> {
  const { query, setQuery, debouncedQuery, active, activate } = useSearchInput()

  const { data, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, error } =
    useInfiniteQuery({
      queryKey: [...queryKeyPrefix, 'search', debouncedQuery],
      queryFn: ({ pageParam }) => fetchPage(debouncedQuery, pageParam),
      initialPageParam: 1,
      getNextPageParam: (last) =>
        last.items.length > 0 && last.page * last.pageSize < last.totalCount
          ? last.page + 1
          : undefined,
      enabled: active,
    })

  return {
    query,
    setQuery,
    results: data?.pages.flatMap((page) => page.items) ?? [],
    isLoading: isFetching && !isFetchingNextPage,
    errorMessage: error instanceof Error ? error.message : undefined,
    activate,
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,
    loadMore: () => void fetchNextPage(),
  }
}

export interface SearchComboboxProps {
  query: string
  onQueryChange: (query: string) => void
  isLoading: boolean
  errorMessage?: string
  onOpen: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
}

export function searchComboboxProps<T>(
  search: EntitySearchState<T> | PagedEntitySearchState<T>,
): SearchComboboxProps {
  const props: SearchComboboxProps = {
    query: search.query,
    onQueryChange: search.setQuery,
    isLoading: search.isLoading,
    errorMessage: search.errorMessage,
    onOpen: search.activate,
  }
  if ('loadMore' in search) {
    props.hasMore = search.hasMore
    props.isLoadingMore = search.isLoadingMore
    props.onLoadMore = search.loadMore
  }
  return props
}
