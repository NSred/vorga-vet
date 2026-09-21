export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  firstName: string
  lastName: string
  password: string
}

export interface AccessTokens {
  accessToken: string
  refreshToken: string
}

export type UserRole = 'client' | 'veterinarian'

export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
}
