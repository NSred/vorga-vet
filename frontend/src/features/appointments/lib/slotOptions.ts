import { clinicTimeOf } from '@/shared/lib/clinicTime'
import type { AvailabilitySlot } from '../types'

export interface SlotOption {
  value: string
  label: string
  disabled: boolean
  isMine: boolean
}

export interface SlotSpan {
  startsAt: string
  endsAt: string
}

function overlaps(slot: AvailabilitySlot, span: SlotSpan): boolean {
  return (
    Date.parse(slot.startsAt) < Date.parse(span.endsAt) &&
    Date.parse(slot.endsAt) > Date.parse(span.startsAt)
  )
}

export function slotOptions(
  slots: AvailabilitySlot[],
  current?: SlotSpan,
  after?: number,
): SlotOption[] {
  return slots
    .filter((slot) => after === undefined || Date.parse(slot.startsAt) > after)
    .map((slot) => ({
      value: slot.startsAt,
      label: clinicTimeOf(slot.startsAt),
      disabled: !slot.isAvailable && !(current && overlaps(slot, current)),
      isMine: slot.isMine,
    }))
}

export function isSelectable(options: SlotOption[], value: string): boolean {
  return options.some((option) => option.value === value && !option.disabled)
}
