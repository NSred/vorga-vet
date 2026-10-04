import { clinicTimeOf } from '@/shared/lib/clinicTime'
import type { Appointment, AvailabilitySlot } from '../types'

export interface DayRow {
  startsAt: string
  endsAt: string
  label: string
  starting: Appointment[]
  continuing: Appointment[]
  isFree: boolean
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

export function buildDayRows(appointments: Appointment[], slots: AvailabilitySlot[]): DayRow[] {
  return slots.map((slot) => {
    const starting = appointments
      .filter((appointment) => startsInSlot(appointment, slot))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))

    const continuing = appointments.filter(
      (appointment) => overlapsSlot(appointment, slot) && !startsInSlot(appointment, slot),
    )

    return {
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      label: clinicTimeOf(slot.startsAt),
      starting,
      continuing,
      isFree: slot.isAvailable && starting.length === 0,
    }
  })
}

export function appointmentsOutsideSlots(
  appointments: Appointment[],
  slots: AvailabilitySlot[],
): Appointment[] {
  return appointments.filter(
    (appointment) => !slots.some((slot) => startsInSlot(appointment, slot)),
  )
}
