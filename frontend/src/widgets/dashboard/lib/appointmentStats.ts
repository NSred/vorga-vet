import { WEEKDAYS } from '@/features/appointments'
import type { Appointment } from '@/features/appointments'
import { parseDateOnly } from '@/shared/lib/dateOnly'

export interface HourCount {
  hour: string
  count: number
}

export interface DayBreakdown {
  day: string
  total: number
  peakHour: HourCount | null
}

export const PEAK_HOURS_RANGE = Array.from(
  { length: 14 },
  (_, index) => `${String(index + 7).padStart(2, '0')}:00`,
)

const MONDAY_FIRST_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function hourBucket(time: string): string {
  return `${time.split(':')[0].padStart(2, '0')}:00`
}

export function countByHour(appointments: Appointment[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const appointment of appointments) {
    const hour = hourBucket(appointment.time)
    counts.set(hour, (counts.get(hour) ?? 0) + 1)
  }
  return counts
}

export function peakOf(counts: Map<string, number>): HourCount | null {
  let peak: HourCount | null = null
  for (const [hour, count] of counts) {
    if (!peak || count > peak.count) {
      peak = { hour, count }
    }
  }
  return peak
}

export function appointmentsOn(appointments: Appointment[], dateIso: string): Appointment[] {
  return appointments.filter((appointment) => appointment.date === dateIso)
}

export function hourHistogram(appointments: Appointment[]): HourCount[] {
  const counts = countByHour(appointments)
  return PEAK_HOURS_RANGE.map((hour) => ({ hour, count: counts.get(hour) ?? 0 }))
}

export function dayBreakdown(appointments: Appointment[]): DayBreakdown[] {
  return MONDAY_FIRST_ORDER.map((weekdayIndex) => {
    const forDay = appointments.filter(
      (appointment) => parseDateOnly(appointment.date).getDay() === weekdayIndex,
    )
    return {
      day: WEEKDAYS[weekdayIndex],
      total: forDay.length,
      peakHour: peakOf(countByHour(forDay)),
    }
  })
}
