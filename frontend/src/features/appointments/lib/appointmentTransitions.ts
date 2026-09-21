import type { AppointmentStatus } from '../types'

const TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  scheduled: ['checked_in', 'completed', 'no_show', 'cancelled'],
  checked_in: ['completed', 'cancelled'],
  completed: [],
  no_show: [],
  cancelled: [],
}

export function canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return TRANSITIONS[from].includes(to)
}

export function allowedTransitions(from: AppointmentStatus): readonly AppointmentStatus[] {
  return TRANSITIONS[from]
}

export function canReschedule(status: AppointmentStatus): boolean {
  return status === 'scheduled'
}
