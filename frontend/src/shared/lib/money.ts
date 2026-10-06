export const MAX_AMOUNT = 99_999_999.99

const formatter = new Intl.NumberFormat('sr-RS', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const CURRENCY = 'RSD'

export function formatAmount(amount: number): string {
  return formatter.format(amount)
}

export function formatPrice(amount: number): string {
  return `${formatAmount(amount)} ${CURRENCY}`
}

const quantityFormatter = new Intl.NumberFormat('sr-RS', {
  maximumFractionDigits: 2,
  useGrouping: false,
})

export function formatQuantity(quantity: number): string {
  return quantityFormatter.format(quantity)
}
