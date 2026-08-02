export interface JwtClaims {
  sub: string
  email: string
}

export function decodeJwt(token: string): JwtClaims {
  const payload = token.split('.')[1]
  const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(json) as JwtClaims
}
