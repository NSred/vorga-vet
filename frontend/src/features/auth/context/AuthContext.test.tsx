import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'
import * as authApi from '@/features/auth/api/authApi'
import * as apiClient from '@/shared/lib/apiClient'
import { createTestQueryClient } from '@/test/renderWithQuery'

function fakeToken(claims: Record<string, string>): string {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, '')
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.signature`
}

function setup() {
  const queryClient = createTestQueryClient()
  queryClient.setQueryData(['patients', 'list'], { items: [] })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )

  const { result } = renderHook(() => useAuth(), { wrapper })
  return { queryClient, result }
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(apiClient, 'refreshAccessToken').mockResolvedValue(false)
})

describe('AuthProvider', () => {
  it('clears cached queries on logout', async () => {
    const { queryClient, result } = setup()
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.logout())

    expect(queryClient.getQueryData(['patients', 'list'])).toBeUndefined()
  })

  it('clears cached queries on login', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({
      accessToken: fakeToken({ sub: 'u1', email: 'vet@example.com' }),
      refreshToken: 'refresh',
    })
    const { queryClient, result } = setup()
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(() => result.current.login({ email: 'vet@example.com', password: 'secret' }))

    expect(queryClient.getQueryData(['patients', 'list'])).toBeUndefined()
  })
})
