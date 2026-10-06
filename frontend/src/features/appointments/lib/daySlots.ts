import { clinicTimeOf } from '@/shared/lib/clinicTime'
import type { Appointment, AvailabilitySlot } from '../types'
import { packLanes, type PlacedBlock } from './lanes'

export interface DayRow {
  startsAt: string
  label: string
  isFree: boolean
  isBusy: boolean
}

export interface DayBlock extends PlacedBlock {
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

function placeBlock(appointment: Appointment, slots: AvailabilitySlot[]): PlacedBlock | null {
  const row = slots.findIndex((slot) => startsInSlot(appointment, slot))
  if (row < 0) return null

  let span = 1
  while (row + span < slots.length && overlapsSlot(appointment, slots[row + span])) span += 1

  return { appointment, row, span }
}

export function layoutDay(appointments: Appointment[], slots: AvailabilitySlot[]): DayLayout {
  const { blocks, laneCount, busyRows } = packLanes(
    appointments
      .map((appointment) => placeBlock(appointment, slots))
      .filter((block): block is PlacedBlock => block !== null),
  )

  const rows = slots.map((slot, index) => ({
    startsAt: slot.startsAt,
    label: clinicTimeOf(slot.startsAt),
    isFree: slot.isAvailable && !busyRows.has(index),
    isBusy: busyRows.has(index),
  }))

  return { rows, blocks, laneCount }
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
