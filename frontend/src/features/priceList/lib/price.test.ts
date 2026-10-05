import { describe, expect, it } from 'vitest'
import { parsePrice, priceError } from './price'

describe('price helpers', () => {
  it('parses a comma or a dot as the decimal separator', () => {
    expect(parsePrice('1500')).toBe(1500)
    expect(parsePrice('1500,5')).toBe(1500.5)
    expect(parsePrice(' 99.99 ')).toBe(99.99)
  })

  it('rejects more than two decimals, negatives and text', () => {
    expect(parsePrice('10,555')).toBeUndefined()
    expect(parsePrice('-5')).toBeUndefined()
    expect(parsePrice('abc')).toBeUndefined()
    expect(parsePrice('')).toBeUndefined()
  })

  it('explains what is wrong with a price', () => {
    expect(priceError('')).toBe('Price is required')
    expect(priceError('12,345')).toBe('Enter an amount such as 1500 or 1500,50')
    expect(priceError('100000000')).toBe('Price is too large')
    expect(priceError('0')).toBeUndefined()
  })
})
