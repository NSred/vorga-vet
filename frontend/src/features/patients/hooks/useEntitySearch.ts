import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'

export interface EntitySearchState<T> {
  query: string
  setQuery: (query: string) => void
  results: T[]
  isLoading: boolean
  errorMessage?: string
}

export function useEntitySearch<T>(
  queryKeyPrefix: readonly unknown[],
  fetcher: (search: string) => Promise<T[]>,
  enabled = true,
): EntitySearchState<T> {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)

  const { data, isFetching, error } = useQuery({
    queryKey: [...queryKeyPrefix, 'search', debouncedQuery],
    queryFn: () => fetcher(debouncedQuery),
    enabled,
  })

  return {
    query,
    setQuery,
    results: data ?? [],
    isLoading: isFetching,
    errorMessage: error instanceof Error ? error.message : undefined,
  }
}
