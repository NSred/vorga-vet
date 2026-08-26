import { useEffect, useRef, useState } from 'react'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'

export interface EntitySearchState<T> {
  query: string
  setQuery: (query: string) => void
  results: T[]
  isLoading: boolean
  errorMessage?: string
}

export function useEntitySearch<T>(
  fetcher: (search: string) => Promise<T[]>,
  enabled = true,
): EntitySearchState<T> {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const debouncedQuery = useDebouncedValue(query, 300)
  const latestRequest = useRef(0)

  useEffect(() => {
    if (!enabled) {
      setResults([])
      setIsLoading(false)
      return
    }

    const requestId = ++latestRequest.current
    setIsLoading(true)
    setErrorMessage(undefined)

    fetcher(debouncedQuery)
      .then((data) => {
        if (requestId !== latestRequest.current) return
        setResults(data)
      })
      .catch((error: unknown) => {
        if (requestId !== latestRequest.current) return
        setErrorMessage(error instanceof Error ? error.message : 'Search failed')
        setResults([])
      })
      .finally(() => {
        if (requestId !== latestRequest.current) return
        setIsLoading(false)
      })
  }, [debouncedQuery, enabled, fetcher])

  return { query, setQuery, results, isLoading, errorMessage }
}
