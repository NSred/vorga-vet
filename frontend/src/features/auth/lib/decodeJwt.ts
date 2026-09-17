import type { UserRole } from '../types'

export interface JwtClaims {
  sub: string
  email: string
  role?: string
}

export function decodeJwt(token: string): JwtClaims {
  const payload = token.split('.')[1]
  const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(json) as JwtClaims
}

export function roleFromClaim(role: string | undefined): UserRole {
  return role === 'Veterinarian' ? 'veterinarian' : 'client'
}
