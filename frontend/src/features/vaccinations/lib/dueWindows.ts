import { addClinicDays } from '@/shared/lib/clinicTime'
import type { DueItem, DueWindow } from '../types'

const DAYS_AHEAD: Record<Exclude<DueWindow, 'overdue'>, number> = {
  week: 7,
  month: 30,
  year: 365,
}

export const DUE_WINDOW_LABELS: Record<DueWindow, string> = {
  overdue: 'Overdue',
  week: 'Next 7 days',
  month: 'Next 30 days',
  year: 'Next 12 months',
}

export function untilFor(window: DueWindow, today: string): string {
  return window === 'overdue' ? addClinicDays(today, -1) : addClinicDays(today, DAYS_AHEAD[window])
}

export function inWindow(item: DueItem, window: DueWindow, today: string): boolean {
  if (window === 'overdue') return item.dueOn < today
  return item.dueOn >= today && item.dueOn <= untilFor(window, today)
}
