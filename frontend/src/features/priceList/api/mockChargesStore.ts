import { ApiError } from '@/shared/lib/apiClient'
import { MAX_AMOUNT } from '@/shared/lib/money'
import type { ChargeLineDto, ExaminationChargesDto } from '../types'
import { priceListErrors } from './priceListErrors'

export const CHARGES_STORAGE_KEY = 'vorgavet.mock.examinationCharges'

const STORE_VERSION = 1
const MAX_NAME_LENGTH = 200
const MAX_DOSE_LENGTH = 100
const MAX_QUANTITY = 9999
const KINDS = ['service', 'medication', 'extra']

interface StoreState {
  version: number
  byExamination: Record<string, ChargeLineDto[]>
}

let state: StoreState | null = null

function isStoreState(value: unknown): value is StoreState {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<StoreState>
  return (
    candidate.version === STORE_VERSION &&
    typeof candidate.byExamination === 'object' &&
    candidate.byExamination !== null
  )
}

function readStorage(): StoreState | null {
  try {
    const raw = window.localStorage.getItem(CHARGES_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isStoreState(parsed) ? parsed : null
  } catch {
    return null
  }
}

function load(): StoreState {
  state ??= readStorage() ?? { version: STORE_VERSION, byExamination: {} }
  return state
}

function commit(): void {
  if (!state) return
  try {
    window.localStorage.setItem(CHARGES_STORAGE_KEY, JSON.stringify(state))
  } catch {
    return
  }
}

export function resetChargesStore(): void {
  state = null
  try {
    window.localStorage.removeItem(CHARGES_STORAGE_KEY)
  } catch {
    return
  }
}

function hasAtMostTwoDecimals(value: number): boolean {
  const cents = value * 100
  return Math.abs(cents - Math.round(cents)) < 1e-6
}

function lineMessages(line: ChargeLineDto, index: number): string[] {
  const messages: string[] = []
  const at = `Line ${index + 1}:`
  const name = line.name?.trim() ?? ''

  if (!KINDS.includes(line.kind)) messages.push(`${at} unknown kind.`)
  if (!name) messages.push(`${at} name is required.`)
  else if (name.length > MAX_NAME_LENGTH) messages.push(`${at} name is too long.`)
  if (
    !Number.isFinite(line.quantity) ||
    line.quantity <= 0 ||
    line.quantity > MAX_QUANTITY ||
    !hasAtMostTwoDecimals(line.quantity)
  ) {
    messages.push(`${at} quantity must be above 0 with at most two decimals.`)
  }
  if (
    !Number.isFinite(line.unitPrice) ||
    line.unitPrice < 0 ||
    !hasAtMostTwoDecimals(line.unitPrice)
  ) {
    messages.push(`${at} price must be 0 or more with at most two decimals.`)
  }
  if (line.dose && (line.kind !== 'medication' || line.dose.length > MAX_DOSE_LENGTH)) {
    messages.push(`${at} a dose up to 100 characters is allowed on medication lines only.`)
  }
  if (line.kind === 'extra' && line.itemId) messages.push(`${at} an additional cost has no item.`)
  if (line.vaccine) {
    if (line.kind !== 'medication') messages.push(`${at} only a medication can be a vaccine.`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(line.vaccine.dueOn))
      messages.push(`${at} the next due date is missing.`)
    if ((line.vaccine.batch?.length ?? 0) > 50) messages.push(`${at} the batch is too long.`)
  }

  return messages
}

export function getCharges(examinationId: string): ExaminationChargesDto {
  const lines = load().byExamination[examinationId] ?? []
  return { lines: lines.map((line) => ({ ...line })) }
}

export function saveCharges(examinationId: string, lines: ChargeLineDto[]): void {
  const messages = lines.flatMap(lineMessages)
  const total = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
  if (total > MAX_AMOUNT) messages.push('The total is too large.')
  if (messages.length > 0) {
    throw new ApiError(
      400,
      'One or more validation errors occurred.',
      priceListErrors.validation,
      messages,
    )
  }

  const current = load()
  if (lines.length === 0) {
    delete current.byExamination[examinationId]
  } else {
    current.byExamination[examinationId] = lines.map((line) => ({
      ...line,
      name: line.name.trim(),
    }))
  }
  commit()
}
