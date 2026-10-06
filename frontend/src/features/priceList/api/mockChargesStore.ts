import { MAX_AMOUNT } from '@/shared/lib/money'
import { assertValid } from '@/shared/lib/mockApi'
import { createMockStore } from '@/shared/lib/mockStore'
import { hasAtMostTwoDecimals, isDateOnly } from '@/shared/lib/validation'
import type { ChargeLineDto, ExaminationChargesDto } from '../types'

export const CHARGES_STORAGE_KEY = 'vorgavet.mock.examinationCharges'

const MAX_NAME_LENGTH = 200
const MAX_DOSE_LENGTH = 100
const MAX_QUANTITY = 9999
const MAX_BATCH_LENGTH = 50
const KINDS = ['service', 'medication', 'extra']

const store = createMockStore<{ byExamination: Record<string, ChargeLineDto[]> }>({
  key: CHARGES_STORAGE_KEY,
  version: 1,
  isValid: (value) => typeof value.byExamination === 'object' && value.byExamination !== null,
  initial: () => ({ byExamination: {} }),
})

export const resetChargesStore = store.reset

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
    if (!isDateOnly(line.vaccine.dueOn)) messages.push(`${at} the next due date is missing.`)
    if ((line.vaccine.batch?.length ?? 0) > MAX_BATCH_LENGTH)
      messages.push(`${at} the batch is too long.`)
  }

  return messages
}

export function getCharges(examinationId: string): ExaminationChargesDto {
  const lines = store.state().byExamination[examinationId] ?? []
  return { lines: lines.map((line) => ({ ...line })) }
}

export function saveCharges(examinationId: string, lines: ChargeLineDto[]): void {
  const messages = lines.flatMap(lineMessages)
  const total = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
  if (total > MAX_AMOUNT) messages.push('The total is too large.')
  assertValid(messages)

  const { byExamination } = store.state()
  if (lines.length === 0) {
    delete byExamination[examinationId]
  } else {
    byExamination[examinationId] = lines.map((line) => ({ ...line, name: line.name.trim() }))
  }
  store.commit()
}
