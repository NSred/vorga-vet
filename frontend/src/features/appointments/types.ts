import type { ExaminationDetails } from '@/shared/domain/examinationDetails'

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

export interface PartyRef {
  id: string
  label: string
}

export interface AppointmentWriteValues {
  date: string
  startsAt: string
  type: AppointmentType
  durationMinutes: number
  owner: PartyRef | null
  patient: PartyRef | null
  reason: string
}

export interface CreateAppointmentRequest {
  ownerId?: string
  patientId?: string
  startsAt: string
  durationMinutes: number
  type: number
  reason?: string
}

export interface RescheduleAppointmentRequest {
  startsAt: string
  durationMinutes?: number
}

export interface NewOwnerDetails {
  firstName: string
  lastName: string
  phoneNumber: string
  address: string
  city: string
  email?: string
}

export interface NewPatientDetails {
  breedId: string
  cardNumber: string
  name: string
  sex: number
  birthDate?: string
  color?: string
  chipNumber?: string
  note?: string
}

export interface OwnerResolution {
  existingOwnerId?: string
  create?: NewOwnerDetails
}

export interface PatientResolution {
  existingPatientId?: string
  create?: NewPatientDetails
}

export interface CheckInRequest {
  owner?: OwnerResolution
  patient?: PatientResolution
}

export interface CheckInResponse {
  ownerId: string
  patientId: string
}

export interface CompleteAppointmentRequest extends CheckInRequest {
  examination: ExaminationDetails
}
