import { useQuery } from '@tanstack/react-query'
import { getCurrentUser } from '../api/authApi'
import { useAuth } from '../context/useAuth'

export function useCurrentUser() {
  const { user } = useAuth()
  const userId = user?.userId ?? null

  return useQuery({
    queryKey: ['auth', 'me', userId],
    queryFn: () => getCurrentUser(userId ?? ''),
    enabled: userId !== null,
    staleTime: Infinity,
  })
}
