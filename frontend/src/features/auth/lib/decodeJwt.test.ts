import { describe, expect, it } from 'vitest'
import { decodeJwt, roleFromClaim } from './decodeJwt'

function fakeToken(claims: Record<string, string>): string {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, '')
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.signature`
}

describe('decodeJwt', () => {
  it('reads the role claim', () => {
    const claims = decodeJwt(fakeToken({ sub: 'u1', email: 'vet@example.com', role: 'Veterinarian' }))

    expect(claims.role).toBe('Veterinarian')
  })
})

describe('roleFromClaim', () => {
  it('maps the veterinarian claim', () => {
    expect(roleFromClaim('Veterinarian')).toBe('veterinarian')
  })

  it('treats a client or missing claim as a client', () => {
    expect(roleFromClaim('Client')).toBe('client')
    expect(roleFromClaim(undefined)).toBe('client')
    expect(roleFromClaim('Admin')).toBe('client')
  })
})
