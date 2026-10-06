import type { PriceListKind } from '../types'

export const priceListErrors = {
  serviceNotFound: 'Services.NotFound',
  serviceNameNotUnique: 'Services.NameNotUnique',
  medicationNotFound: 'Medications.NotFound',
  medicationNameNotUnique: 'Medications.NameNotUnique',
} as const

export const DUPLICATE_NAME_MESSAGE =
  'This name is already on the price list. If it was retired, find it under Retired and restore it.'

export function notFoundCode(kind: PriceListKind): string {
  return kind === 'service' ? priceListErrors.serviceNotFound : priceListErrors.medicationNotFound
}

export function nameNotUniqueCode(kind: PriceListKind): string {
  return kind === 'service'
    ? priceListErrors.serviceNameNotUnique
    : priceListErrors.medicationNameNotUnique
}
