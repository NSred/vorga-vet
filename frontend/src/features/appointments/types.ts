export type AppointmentType = 'first_visit' | 'checkup' | 'vaccination' | 'other'
export type CalendarView = 'day' | 'week' | 'month'

export interface AppointmentAttachment {
  id: string
  fileName: string
  fileType: string
  fileSizeBytes: number
  previewUrl?: string
}

export interface Appointment {
  id: string
  patientId: string
  date: string
  time: string
  type: AppointmentType
  note?: string
  reminderEnabled: boolean
  attachments: AppointmentAttachment[]
}

export type AppointmentInput = Omit<Appointment, 'id' | 'attachments'>
