import type { BadgeTone } from '@/shared/ui'
import { clinicTimeOf } from '@/shared/lib/clinicTime'
import type { Appointment, AppointmentStatus, AppointmentType } from '../types'

const TYPE_LABELS: Record<AppointmentType, string> = {
  first_visit: 'First visit',
  checkup: 'Checkup',
  blood_draw: 'Blood draw',
  surgery: 'Surgery',
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Scheduled',
  checked_in: 'Checked in',
  completed: 'Completed',
  no_show: 'No show',
  cancelled: 'Cancelled',
}

const STATUS_TONES: Record<AppointmentStatus, BadgeTone> = {
  scheduled: 'neutral',
  checked_in: 'ok',
  completed: 'neutral',
  no_show: 'danger',
  cancelled: 'danger',
}

export function typeLabel(type: AppointmentType): string {
  return TYPE_LABELS[type]
}

export function statusLabel(status: AppointmentStatus): string {
  return STATUS_LABELS[status]
}

export function statusTone(status: AppointmentStatus): BadgeTone {
  return STATUS_TONES[status]
}

export function appointmentTimeLabel(appointment: Appointment): string {
  const start = clinicTimeOf(appointment.startsAt)

  if (appointment.durationMinutes <= 30) {
    return start
  }

  return `${start}–${clinicTimeOf(appointment.endsAt)}`
}

export function partyLabel(appointment: Appointment): string {
  const patient = appointment.patientName ?? 'No patient yet'

  if (appointment.ownerName) {
    return `${patient} · ${appointment.ownerName}`
  }

  return appointment.patientName ?? 'Client booking'
}
