import { describe, expect, it } from 'vitest'
import { coatColorOf } from './coatColors'

describe('coatColorOf', () => {
  it('finds a listed colour regardless of case and spaces', () => {
    expect(coatColorOf('  black AND white ')?.name).toBe('Black and white')
  })

  it('returns nothing for free text or an empty value', () => {
    expect(coatColorOf('Brindle with white socks')).toBeUndefined()
    expect(coatColorOf('')).toBeUndefined()
    expect(coatColorOf(undefined)).toBeUndefined()
  })
})
