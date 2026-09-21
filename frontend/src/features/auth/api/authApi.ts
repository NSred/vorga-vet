import { apiFetch } from '@/shared/lib/apiClient'
import type {
  AccessTokens,
  LoginRequest,
  RegisterRequest,
  UserProfile,
} from '@/features/auth/types'

export function login(request: LoginRequest): Promise<AccessTokens> {
  return apiFetch<AccessTokens>('/users/login', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function register(request: RegisterRequest): Promise<string> {
  return apiFetch<string>('/users/register', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function getCurrentUser(userId: string): Promise<UserProfile> {
  return apiFetch<UserProfile>(`/users/${userId}`)
}
