import { formatDateOnly, formatDisplayDate, parseDateOnly, todayIso } from '@/shared/lib/dateOnly'

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function formatWeekday(dateIso: string): string {
  return WEEKDAYS[parseDateOnly(dateIso).getDay()]
}

export type AppointmentStatus = 'completed' | 'today' | 'upcoming'

export function getAppointmentStatus(dateIso: string): AppointmentStatus {
  const today = todayIso()
  if (dateIso < today) return 'completed'
  if (dateIso === today) return 'today'
  return 'upcoming'
}

export function formatReminderDate(dateIso: string): string {
  const date = parseDateOnly(dateIso)
  date.setDate(date.getDate() - 1)
  return formatDisplayDate(formatDateOnly(date))
}
