import type { ExaminationDetails } from '@/shared/domain/examinationDetails'

export type { ExaminationDetails }

export type AttachmentKind = 'xray' | 'ultrasound'

export interface AttachmentDto {
  id: string
  kind: number
  fileName: string
  contentType: string
  sizeBytes: number
  uploadedAt: string
}

export interface ExaminationDto {
  id: string
  patientId: string
  patientName: string | null
  appointmentId: string | null
  performedByFirstName: string
  performedByLastName: string
  startedAt: string
  endedAt: string | null
  anamnesis: string | null
  diagnosis: string | null
  therapy: string | null
  cost: number | null
  isPaid: boolean
  paidAt: string | null
  createdAt: string
  attachments: AttachmentDto[]
}

export interface Attachment {
  id: string
  kind: AttachmentKind
  fileName: string
  contentType: string
  sizeBytes: number
  uploadedAt: string
}

export interface Examination {
  id: string
  patientId: string
  patientName?: string
  appointmentId?: string
  performedByFirstName: string
  performedByLastName: string
  startedAt: string
  endedAt?: string
  anamnesis?: string
  diagnosis?: string
  therapy?: string
  cost?: number
  isPaid: boolean
  paidAt?: string
  createdAt: string
  attachments: Attachment[]
}

export interface CreateExaminationRequest {
  patientId: string
  examination: ExaminationDetails
}

export interface ExaminationFormValues {
  performedByFirstName: string
  performedByLastName: string
  anamnesis: string
  diagnosis: string
  therapy: string
  cost: string
}
