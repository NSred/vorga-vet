import { clinicDateOf } from '@/shared/lib/clinicTime'
import type { Appointment, AvailabilitySlot } from '../types'

export function groupByClinicDate(appointments: Appointment[]): Map<string, Appointment[]> {
  const grouped = new Map<string, Appointment[]>()

  for (const appointment of appointments) {
    const date = clinicDateOf(appointment.startsAt)
    grouped.set(date, [...(grouped.get(date) ?? []), appointment])
  }

  for (const [date, items] of grouped) {
    grouped.set(date, [...items].sort((a, b) => a.startsAt.localeCompare(b.startsAt)))
  }

  return grouped
}

export function openDates(slots: AvailabilitySlot[]): Set<string> {
  return new Set(slots.map((slot) => clinicDateOf(slot.startsAt)))
}
