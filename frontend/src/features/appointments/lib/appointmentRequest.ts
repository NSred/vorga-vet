import { typeToApi } from './appointmentMapping'
import type {
  AppointmentWriteValues,
  CreateAppointmentRequest,
  RescheduleAppointmentRequest,
} from '../types'

function trimmed(value: string): string | undefined {
  const text = value.trim()
  return text ? text : undefined
}

export function toCreateRequest(values: AppointmentWriteValues): CreateAppointmentRequest {
  return {
    ownerId: values.owner?.id,
    patientId: values.patient?.id,
    startsAt: values.startsAt,
    durationMinutes: values.type === 'surgery' ? values.durationMinutes : 30,
    type: typeToApi(values.type),
    reason: trimmed(values.reason),
  }
}

export function toRescheduleRequest(values: AppointmentWriteValues): RescheduleAppointmentRequest {
  return {
    startsAt: values.startsAt,
    durationMinutes: values.type === 'surgery' ? values.durationMinutes : undefined,
  }
}
