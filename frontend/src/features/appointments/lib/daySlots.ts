import { clinicTimeOf } from '@/shared/lib/clinicTime'
import type { Appointment, AvailabilitySlot } from '../types'

export interface DayRow {
  startsAt: string
  label: string
  isFree: boolean
  isBusy: boolean
}

export interface DayBlock {
  appointment: Appointment
  row: number
  span: number
  lane: number
}

export interface DayLayout {
  rows: DayRow[]
  blocks: DayBlock[]
  laneCount: number
}

function startsInSlot(appointment: Appointment, slot: AvailabilitySlot): boolean {
  const start = Date.parse(appointment.startsAt)

  return start >= Date.parse(slot.startsAt) && start < Date.parse(slot.endsAt)
}

function overlapsSlot(appointment: Appointment, slot: AvailabilitySlot): boolean {
  return (
    Date.parse(appointment.startsAt) < Date.parse(slot.endsAt) &&
    Date.parse(appointment.endsAt) > Date.parse(slot.startsAt)
  )
}

function placeBlock(
  appointment: Appointment,
  slots: AvailabilitySlot[],
): Omit<DayBlock, 'lane'> | null {
  const row = slots.findIndex((slot) => startsInSlot(appointment, slot))
  if (row < 0) return null

  let span = 1
  while (row + span < slots.length && overlapsSlot(appointment, slots[row + span])) span += 1

  return { appointment, row, span }
}

export function layoutDay(appointments: Appointment[], slots: AvailabilitySlot[]): DayLayout {
  const placed = appointments
    .map((appointment) => placeBlock(appointment, slots))
    .filter((block): block is Omit<DayBlock, 'lane'> => block !== null)
    .sort((a, b) => a.row - b.row || a.appointment.startsAt.localeCompare(b.appointment.startsAt))

  const laneEnds: number[] = []
  const blocks = placed.map((block) => {
    let lane = laneEnds.findIndex((end) => end <= block.row)
    if (lane < 0) lane = laneEnds.length
    laneEnds[lane] = block.row + block.span
    return { ...block, lane }
  })

  const busy = new Set<number>()
  for (const block of blocks) {
    for (let row = block.row; row < block.row + block.span; row += 1) busy.add(row)
  }

  const rows = slots.map((slot, index) => ({
    startsAt: slot.startsAt,
    label: clinicTimeOf(slot.startsAt),
    isFree: slot.isAvailable && !busy.has(index),
    isBusy: busy.has(index),
  }))

  return { rows, blocks, laneCount: Math.max(1, laneEnds.length) }
}

export function appointmentsOutsideSlots(
  appointments: Appointment[],
  slots: AvailabilitySlot[],
): Appointment[] {
  return appointments.filter(
    (appointment) => !slots.some((slot) => startsInSlot(appointment, slot)),
  )
}

export function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}
