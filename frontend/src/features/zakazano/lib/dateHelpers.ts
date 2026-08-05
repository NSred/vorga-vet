import { formatDateOnly, formatDisplayDate, parseDateOnly, todayIso } from '@/shared/lib/dateOnly'

export const WEEKDAYS = ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota']

export function formatWeekday(dateIso: string): string {
  return WEEKDAYS[parseDateOnly(dateIso).getDay()]
}

export type AppointmentStatus = 'zavrsen' | 'danas' | 'predstoji'

export function getAppointmentStatus(dateIso: string): AppointmentStatus {
  const today = todayIso()
  if (dateIso < today) return 'zavrsen'
  if (dateIso === today) return 'danas'
  return 'predstoji'
}

export function formatReminderDate(dateIso: string): string {
  const date = parseDateOnly(dateIso)
  date.setDate(date.getDate() - 1)
  return formatDisplayDate(formatDateOnly(date))
}
