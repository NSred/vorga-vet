export type AppointmentType = 'first_visit' | 'checkup' | 'blood_draw' | 'surgery'
export type AppointmentStatus = 'scheduled' | 'checked_in' | 'completed' | 'no_show' | 'cancelled'
export type CalendarView = 'day' | 'week' | 'month'

export interface AppointmentDto {
  id: string
  createdByUserId: string
  ownerId: string | null
  patientId: string | null
  startsAt: string
  endsAt: string
  durationMinutes: number
  type: number
  status: number
  reason: string | null
  ownerName: string | null
  patientName: string | null
  createdAt: string
}

export interface Appointment {
  id: string
  createdByUserId: string
  ownerId?: string
  patientId?: string
  startsAt: string
  endsAt: string
  durationMinutes: number
  type: AppointmentType
  status: AppointmentStatus
  reason?: string
  ownerName?: string
  patientName?: string
  createdAt: string
}

export interface AvailabilitySlot {
  startsAt: string
  endsAt: string
  isAvailable: boolean
  isMine: boolean
}
