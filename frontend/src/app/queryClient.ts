import { QueryCache, QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/shared/lib/apiClient'

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: { errorTitle?: string }
  }
}

export interface QueryClientHandlers {
  onQueryError: (title: string) => void
  retry?: boolean
}

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status < 500) return false
  return failureCount < 2
}

export function createQueryClient({
  onQueryError,
  retry = true,
}: QueryClientHandlers): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (_error, query) => {
        const title = query.meta?.errorTitle
        if (title) onQueryError(title)
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: retry ? shouldRetry : false,
      },
    },
  })
}
