import { addClinicDays } from '@/shared/lib/clinicTime'
import { formatQuantity, MAX_AMOUNT } from '@/shared/lib/money'
import type {
  ChargeDraft,
  ChargeDraftErrors,
  ChargeLine,
  ChargeLineKind,
  PriceListItem,
} from '../types'
import { parsePrice, priceError } from './price'

export const EARLIER_COST_NAME = 'Cost entered earlier'
export const MAX_QUANTITY = 9999
export const MAX_DOSE_LENGTH = 100
export const MAX_LINE_NAME_LENGTH = 200
export const MAX_BATCH_LENGTH = 50

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const QUANTITY_PATTERN = /^\d+([.,]\d{1,2})?$/

let keySequence = 0

function nextKey(): string {
  keySequence += 1
  return `draft-${keySequence}`
}

function toInput(amount: number): string {
  return String(amount).replace('.', ',')
}

function round(amount: number): number {
  return Math.round(amount * 100) / 100
}

export function parseQuantity(text: string): number | undefined {
  const compact = text.trim().replace(/\s/g, '')
  if (!QUANTITY_PATTERN.test(compact)) return undefined
  const quantity = Number(compact.replace(',', '.'))
  return quantity > 0 && quantity <= MAX_QUANTITY ? quantity : undefined
}

export function draftErrors(draft: ChargeDraft): ChargeDraftErrors {
  const errors: ChargeDraftErrors = {}
  const name = draft.name.trim()

  if (!name) errors.name = 'Describe the cost'
  else if (name.length > MAX_LINE_NAME_LENGTH) errors.name = 'Maximum 200 characters'

  const price = priceError(draft.unitPrice)
  if (price) errors.unitPrice = price

  if (parseQuantity(draft.quantity) === undefined) errors.quantity = 'Enter a quantity above 0'

  if (draft.kind === 'medication' && draft.dose.trim().length > MAX_DOSE_LENGTH) {
    errors.dose = 'Maximum 100 characters'
  }

  if (draft.vaccine) {
    if (draft.vaccine.batch.trim().length > MAX_BATCH_LENGTH)
      errors.batch = 'Batch: maximum 50 characters'
    if (!DATE_PATTERN.test(draft.vaccine.dueOn)) errors.dueOn = 'Pick the next due date'
  }

  return errors
}

export function isDraftValid(draft: ChargeDraft): boolean {
  return Object.keys(draftErrors(draft)).length === 0
}

export function draftTotal(draft: ChargeDraft): number | undefined {
  const price = parsePrice(draft.unitPrice)
  const quantity = parseQuantity(draft.quantity)
  return price === undefined || quantity === undefined ? undefined : round(price * quantity)
}

export function chargesTotal(drafts: ChargeDraft[]): number {
  return round(drafts.reduce((sum, draft) => sum + (draftTotal(draft) ?? 0), 0))
}

export function chargesError(drafts: ChargeDraft[]): string | undefined {
  return chargesTotal(drafts) > MAX_AMOUNT ? 'The total is too large' : undefined
}

export function draftFromItem(item: PriceListItem, givenOn: string): ChargeDraft {
  const draft: ChargeDraft = {
    key: nextKey(),
    kind: item.kind,
    itemId: item.id,
    name: item.name,
    unitPrice: toInput(item.price),
    quantity: '1',
    dose: '',
  }
  if (item.kind === 'medication' && item.vaccine) {
    draft.vaccine = {
      isRabies: item.vaccine.isRabies,
      validityDays: item.vaccine.validityDays,
      batch: '',
      dueOn: addClinicDays(givenOn, item.vaccine.validityDays),
    }
  }
  return draft
}

export function extraDraft(name = '', amount?: number): ChargeDraft {
  return {
    key: nextKey(),
    kind: 'extra',
    name,
    unitPrice: amount === undefined ? '' : toInput(amount),
    quantity: '1',
    dose: '',
  }
}

export function toDraft(line: ChargeLine): ChargeDraft {
  return {
    key: nextKey(),
    kind: line.kind,
    itemId: line.itemId,
    name: line.name,
    unitPrice: toInput(line.unitPrice),
    quantity: toInput(line.quantity),
    dose: line.dose ?? '',
    ...(line.vaccine
      ? {
          vaccine: {
            isRabies: line.vaccine.isRabies,
            validityDays: 0,
            batch: line.vaccine.batch ?? '',
            dueOn: line.vaccine.dueOn,
          },
        }
      : {}),
  }
}

export function fromDraft(draft: ChargeDraft, id: string): ChargeLine {
  const line: ChargeLine = {
    id,
    kind: draft.kind,
    name: draft.name.trim(),
    unitPrice: parsePrice(draft.unitPrice) ?? 0,
    quantity: parseQuantity(draft.quantity) ?? 1,
  }
  if (draft.kind !== 'extra' && draft.itemId) line.itemId = draft.itemId
  const dose = draft.dose.trim()
  if (draft.kind === 'medication' && dose) line.dose = dose
  if (draft.kind === 'medication' && draft.vaccine) {
    const batch = draft.vaccine.batch.trim()
    line.vaccine = { isRabies: draft.vaccine.isRabies, dueOn: draft.vaccine.dueOn }
    if (batch) line.vaccine.batch = batch
  }
  return line
}

export function initialDrafts(lines: ChargeLine[], earlierCost?: number): ChargeDraft[] {
  if (lines.length > 0) return lines.map(toDraft)
  if (earlierCost !== undefined && earlierCost > 0)
    return [extraDraft(EARLIER_COST_NAME, earlierCost)]
  return []
}

export function lineTotal(line: ChargeLine): number {
  return round(line.unitPrice * line.quantity)
}

export const KIND_LABEL: Record<ChargeLineKind, string> = {
  service: 'Service',
  medication: 'Medication',
  extra: 'Additional cost',
}

export function chargesText(lines: ChargeLine[]): string {
  return lines
    .map((line) =>
      line.quantity === 1 ? line.name : `${line.name} ×${formatQuantity(line.quantity)}`,
    )
    .join(', ')
}
