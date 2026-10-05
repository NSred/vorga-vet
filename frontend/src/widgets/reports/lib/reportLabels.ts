import { differenceInCalendarDays, format } from 'date-fns'
import { clinicTimeOf, clinicToday } from '@/shared/lib/clinicTime'
import { formatDisplayDate, parseDateOnly } from '@/shared/lib/dateOnly'

export function printedAtSr(): string {
  return `Odštampano ${formatDisplayDate(clinicToday())}. u ${clinicTimeOf(new Date().toISOString())}`
}

export function daysAgo(day: string, today: string): string {
  const days = differenceInCalendarDays(parseDateOnly(today), parseDateOnly(day))
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

export function dayWithWeekday(day: string): string {
  return `${format(parseDateOnly(day), 'EEEE')} ${formatDisplayDate(day)}`
}
