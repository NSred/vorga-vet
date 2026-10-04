import type { Appointment } from '../types'

export function countsTowardLoad(appointment: Appointment): boolean {
  return appointment.status !== 'cancelled' && appointment.status !== 'no_show'
}

export function isVisible(appointment: Appointment, showCancelled: boolean): boolean {
  return showCancelled || countsTowardLoad(appointment)
}

export function isOpen(appointment: Appointment): boolean {
  return appointment.status === 'scheduled' || appointment.status === 'checked_in'
}
