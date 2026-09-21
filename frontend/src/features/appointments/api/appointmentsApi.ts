import { apiFetch } from '@/shared/lib/apiClient'
import type { DateRange } from '@/shared/lib/clinicTime'
import { toAppointment } from '../lib/appointmentMapping'
import type { Appointment, AppointmentDto, AvailabilitySlot } from '../types'

function rangeQuery(range: DateRange): string {
  const params = new URLSearchParams()
  params.set('from', range.from)
  params.set('to', range.to)

  return params.toString()
}

export async function getAppointments(range: DateRange): Promise<Appointment[]> {
  const response = await apiFetch<AppointmentDto[]>(`/appointments?${rangeQuery(range)}`)

  return response.map(toAppointment)
}

export function getAvailability(range: DateRange): Promise<AvailabilitySlot[]> {
  return apiFetch<AvailabilitySlot[]>(`/appointments/availability?${rangeQuery(range)}`)
}
