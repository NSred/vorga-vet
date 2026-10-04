import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'
import { useToast } from '@/shared/ui'
import { createQueryClient } from '@/app/queryClient'

export function QueryProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast()
  const [client] = useState(() =>
    createQueryClient({ onQueryError: (title) => showToast({ tone: 'error', title }) }),
  )

  return (
    <QueryClientProvider client={client}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
