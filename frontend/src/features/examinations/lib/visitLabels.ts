import type { Examination } from '../types'

export function hasCharge(examination: Examination): boolean {
  return (examination.cost ?? 0) > 0
}

export function isUnpaid(examination: Examination): boolean {
  return hasCharge(examination) && !examination.isPaid
}

export function performerOf(examination: Examination): string {
  return `${examination.performedByFirstName} ${examination.performedByLastName}`.trim()
}

export function visitOrigin(examination: Examination): string {
  return examination.appointmentId ? 'Appointment' : 'Walk-in'
}
