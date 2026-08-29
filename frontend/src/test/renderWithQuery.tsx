import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import { useState, type ReactElement, type ReactNode } from 'react'

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
    },
  })
}

export function QueryWrapper({ children }: { children: ReactNode }) {
  const [client] = useState(createTestQueryClient)
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

export function renderWithQuery(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { ...options, wrapper: QueryWrapper })
}
