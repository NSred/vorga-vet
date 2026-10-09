import { failValidation } from '@/shared/lib/mockApi'
import { createMockStore } from '@/shared/lib/mockStore'
import { hasAtMostTwoDecimals } from '@/shared/lib/validation'
import { MAX_RSD_PER_EUR } from '../lib/price'
import type { ExchangeRate } from '../types'

export const EXCHANGE_RATE_STORAGE_KEY = 'vorgavet.mock.exchangeRate'

const store = createMockStore<ExchangeRate>({
  key: EXCHANGE_RATE_STORAGE_KEY,
  version: 1,
  isValid: (value) => 'rsdPerEur' in value && 'updatedAt' in value,
  initial: () => ({ rsdPerEur: null, updatedAt: null }),
})

export function readExchangeRate(): ExchangeRate {
  const { rsdPerEur, updatedAt } = store.state()
  return { rsdPerEur, updatedAt }
}

export function writeExchangeRate(rsdPerEur: number): void {
  if (!(rsdPerEur > 0) || rsdPerEur > MAX_RSD_PER_EUR || !hasAtMostTwoDecimals(rsdPerEur)) {
    failValidation([`The rate must be greater than 0 and at most ${MAX_RSD_PER_EUR}.`])
  }

  const state = store.state()
  state.rsdPerEur = rsdPerEur
  state.updatedAt = new Date().toISOString()
  store.commit()
}

export const resetExchangeRateStore = store.reset
