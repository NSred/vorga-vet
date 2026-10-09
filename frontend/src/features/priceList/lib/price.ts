import { MAX_AMOUNT } from '@/shared/lib/money'

const PRICE_PATTERN = /^\d+([.,]\d{1,2})?$/

export function parsePrice(text: string): number | undefined {
  const compact = text.trim().replace(/\s/g, '')
  if (!PRICE_PATTERN.test(compact)) return undefined
  return Number(compact.replace(',', '.'))
}

export function priceError(text: string): string | undefined {
  if (!text.trim()) return 'Price is required'
  const price = parsePrice(text)
  if (price === undefined) return 'Enter an amount such as 1500 or 1500,50'
  if (price > MAX_AMOUNT) return 'Price is too large'
  return undefined
}

export const MAX_RSD_PER_EUR = 1000

export function rateError(text: string): string | undefined {
  const rate = parsePrice(text)
  if (rate === undefined) return 'Enter a rate such as 117,20'
  if (rate <= 0 || rate > MAX_RSD_PER_EUR) {
    return `The rate must be greater than 0 and at most ${MAX_RSD_PER_EUR}`
  }
  return undefined
}
