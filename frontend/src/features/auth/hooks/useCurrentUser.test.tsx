import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { QueryWrapper } from '@/test/renderWithQuery'
import * as authApi from '../api/authApi'
import { useCurrentUser } from './useCurrentUser'

const auth = vi.hoisted(() => ({ userId: 'u1' as string | null }))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: auth.userId ? { userId: auth.userId, email: 'v@x.com', role: 'veterinarian' } : null,
  }),
}))

afterEach(() => {
  vi.restoreAllMocks()
  auth.userId = 'u1'
})

describe('useCurrentUser', () => {
  it('loads the profile of the logged-in user', async () => {
    const spy = vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue({
      id: 'u1',
      firstName: 'Mira',
      lastName: 'Vet',
      email: 'v@x.com',
    })

    const { result } = renderHook(() => useCurrentUser(), { wrapper: QueryWrapper })

    await waitFor(() => expect(result.current.data?.firstName).toBe('Mira'))
    expect(spy).toHaveBeenCalledWith('u1')
  })

  it('does nothing while logged out', () => {
    auth.userId = null
    const spy = vi.spyOn(authApi, 'getCurrentUser')

    const { result } = renderHook(() => useCurrentUser(), { wrapper: QueryWrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(spy).not.toHaveBeenCalled()
  })
})
