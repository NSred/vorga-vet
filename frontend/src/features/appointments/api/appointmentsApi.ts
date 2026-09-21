import { apiFetch } from '@/shared/lib/apiClient'
import type { DateRange } from '@/shared/lib/clinicTime'
import { toAppointment } from '../lib/appointmentMapping'
import type {
  Appointment,
  AppointmentDto,
  AvailabilitySlot,
  CheckInRequest,
  CheckInResponse,
  CompleteAppointmentRequest,
  CreateAppointmentRequest,
  RescheduleAppointmentRequest,
} from '../types'

function rangeQuery(range: DateRange, durationMinutes?: number): string {
  const params = new URLSearchParams()
  params.set('from', range.from)
  params.set('to', range.to)

  if (durationMinutes !== undefined) {
    params.set('durationMinutes', String(durationMinutes))
  }

  return params.toString()
}

function post<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) })
}

export async function getAppointments(range: DateRange): Promise<Appointment[]> {
  const response = await apiFetch<AppointmentDto[]>(`/appointments?${rangeQuery(range)}`)

  return response.map(toAppointment)
}

export async function getAppointment(id: string): Promise<Appointment> {
  return toAppointment(await apiFetch<AppointmentDto>(`/appointments/${id}`))
}

export async function getUnresolvedAppointments(): Promise<Appointment[]> {
  const response = await apiFetch<AppointmentDto[]>('/appointments/unresolved')

  return response.map(toAppointment)
}

export function getAvailability(
  range: DateRange,
  durationMinutes?: number,
): Promise<AvailabilitySlot[]> {
  return apiFetch<AvailabilitySlot[]>(
    `/appointments/availability?${rangeQuery(range, durationMinutes)}`,
  )
}

export function createAppointment(request: CreateAppointmentRequest): Promise<string> {
  return post<string>('/appointments', request)
}

export function rescheduleAppointment(
  id: string,
  request: RescheduleAppointmentRequest,
): Promise<void> {
  return post<void>(`/appointments/${id}/reschedule`, request)
}

export function cancelAppointment(id: string, reason?: string): Promise<void> {
  return post<void>(`/appointments/${id}/cancel`, { reason: reason || undefined })
}

export function markNoShow(id: string, note?: string): Promise<void> {
  return post<void>(`/appointments/${id}/no-show`, { note: note || undefined })
}

export function checkInAppointment(id: string, request: CheckInRequest): Promise<CheckInResponse> {
  return post<CheckInResponse>(`/appointments/${id}/check-in`, request)
}

export function completeAppointment(
  id: string,
  request: CompleteAppointmentRequest,
): Promise<string> {
  return post<string>(`/appointments/${id}/complete`, request)
}
