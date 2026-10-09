import { settle } from '@/shared/lib/mockApi'
import type { ExchangeRate } from '../types'
import { readExchangeRate, writeExchangeRate } from './mockExchangeRateStore'

export async function getExchangeRate(): Promise<ExchangeRate> {
  await settle()
  return readExchangeRate()
}

export async function setExchangeRate(rsdPerEur: number): Promise<void> {
  await settle()
  writeExchangeRate(rsdPerEur)
}
