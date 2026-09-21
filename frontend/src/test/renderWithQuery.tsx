import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import { useState, type ReactElement, type ReactNode } from 'react'
import { createQueryClient } from '@/app/queryClient'
import { ToastProvider, useToast } from '@/shared/ui'

export function createTestQueryClient(): QueryClient {
  return createQueryClient({ onQueryError: () => undefined, retry: false })
}

function TestQueryProvider({ client, children }: { client?: QueryClient; children: ReactNode }) {
  const { showToast } = useToast()
  const [ownClient] = useState(() =>
    createQueryClient({
      onQueryError: (title) => showToast({ tone: 'error', title }),
      retry: false,
    }),
  )

  return <QueryClientProvider client={client ?? ownClient}>{children}</QueryClientProvider>
}

export function QueryWrapper({ client, children }: { client?: QueryClient; children: ReactNode }) {
  return (
    <ToastProvider>
      <TestQueryProvider client={client}>{children}</TestQueryProvider>
    </ToastProvider>
  )
}

export function renderWithQuery(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { ...options, wrapper: QueryWrapper })
}
