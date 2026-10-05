import { differenceInCalendarDays } from 'date-fns'
import { parseDateOnly } from '@/shared/lib/dateOnly'

const DAYS_PER_MONTH = 30.4375
const DAYS_BEFORE_MONTHS = 60

function span(days: number): string {
  if (days < DAYS_BEFORE_MONTHS) return days === 1 ? '1 day' : `${days} days`
  const months = Math.round(days / DAYS_PER_MONTH)
  return months === 1 ? '1 month' : `${months} months`
}

export function relativeDue(dueOn: string, today: string): string {
  const days = differenceInCalendarDays(parseDateOnly(dueOn), parseDateOnly(today))
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  return days > 0 ? `In ${span(days)}` : `${span(-days)} overdue`
}
