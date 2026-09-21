import type { Appointment, AppointmentDto, AppointmentStatus, AppointmentType } from '../types'

const TYPES: Record<number, AppointmentType> = {
  0: 'first_visit',
  1: 'checkup',
  2: 'blood_draw',
  3: 'surgery',
}

const STATUSES: Record<number, AppointmentStatus> = {
  0: 'scheduled',
  1: 'checked_in',
  2: 'completed',
  3: 'no_show',
  4: 'cancelled',
}

function optional<T>(value: T | null): T | undefined {
  return value ?? undefined
}

export function typeFromApi(value: number): AppointmentType {
  const type = TYPES[value]
  if (!type) throw new Error(`Unknown appointment type: ${value}`)
  return type
}

export function statusFromApi(value: number): AppointmentStatus {
  const status = STATUSES[value]
  if (!status) throw new Error(`Unknown appointment status: ${value}`)
  return status
}

export function toAppointment(dto: AppointmentDto): Appointment {
  return {
    id: dto.id,
    createdByUserId: dto.createdByUserId,
    ownerId: optional(dto.ownerId),
    patientId: optional(dto.patientId),
    startsAt: dto.startsAt,
    endsAt: dto.endsAt,
    durationMinutes: dto.durationMinutes,
    type: typeFromApi(dto.type),
    status: statusFromApi(dto.status),
    reason: optional(dto.reason),
    ownerName: optional(dto.ownerName),
    patientName: optional(dto.patientName),
    createdAt: dto.createdAt,
  }
}
