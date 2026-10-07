import { addClinicDays, clinicDateOf, clinicWeekRange } from '@/shared/lib/clinicTime'
import type { Appointment, AvailabilitySlot } from '../types'

export function weekDays(date: string): string[] {
  const monday = clinicDateOf(clinicWeekRange(date).from)
  return Array.from({ length: 7 }, (_, index) => addClinicDays(monday, index))
}

export function groupByClinicDate(appointments: Appointment[]): Map<string, Appointment[]> {
  const grouped = new Map<string, Appointment[]>()

  for (const appointment of appointments) {
    const date = clinicDateOf(appointment.startsAt)
    grouped.set(date, [...(grouped.get(date) ?? []), appointment])
  }

  for (const [date, items] of grouped) {
    grouped.set(
      date,
      [...items].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    )
  }

  return grouped
}

export function openDates(slots: AvailabilitySlot[]): Set<string> {
  return new Set(slots.map((slot) => clinicDateOf(slot.startsAt)))
}
