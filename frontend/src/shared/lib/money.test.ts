import { describe, expect, it } from 'vitest'
import { formatEuro, formatPrice, formatQuantity, MAX_AMOUNT } from './money'

describe('formatPrice', () => {
  it('formats dinars with Serbian separators', () => {
    expect(formatPrice(1234.5)).toBe('1.234,50 RSD')
    expect(formatPrice(0)).toBe('0,00 RSD')
    expect(formatPrice(MAX_AMOUNT)).toBe('99.999.999,99 RSD')
  })
})

describe('formatQuantity', () => {
  it('formats quantities with a decimal comma and no grouping', () => {
    expect(formatQuantity(2)).toBe('2')
    expect(formatQuantity(2.5)).toBe('2,5')
    expect(formatQuantity(0.25)).toBe('0,25')
    expect(formatQuantity(1500)).toBe('1500')
  })
})

describe('formatEuro', () => {
  it('converts dinars to euros at the rate, rounded to cents', () => {
    expect(formatEuro(1500, 117.2)).toBe('≈ 12,80 €')
    expect(formatEuro(117200, 117.2)).toBe('≈ 1.000,00 €')
  })
})
