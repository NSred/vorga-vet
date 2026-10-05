import type { AnimalDetails, OwnerDetails } from '@/shared/domain/animal'

export type VaccinationSource = 'exam' | 'manual'

export interface VaccinationDto {
  id: string
  patientId: string
  examinationId: string | null
  itemId: string | null
  vaccineName: string
  isRabies: boolean
  batch: string | null
  givenOn: string
  dueOn: string
  source: VaccinationSource
  contactedAt: string | null
  createdAt: string
}

export interface Vaccination {
  id: string
  patientId: string
  examinationId?: string
  itemId?: string
  vaccineName: string
  isRabies: boolean
  batch?: string
  givenOn: string
  dueOn: string
  source: VaccinationSource
  contactedAt?: string
}

export interface ManualVaccinationRequest {
  vaccineName: string
  itemId?: string | null
  isRabies: boolean
  batch?: string | null
  givenOn: string
  dueOn: string
}

export interface ExamVaccinationLine {
  itemId: string
  vaccineName: string
  isRabies: boolean
  batch?: string | null
  dueOn: string
}

export interface ExamVaccinationsRequest {
  patientId: string
  givenOn: string
  lines: ExamVaccinationLine[]
}

export interface ReminderDto {
  id: string
  patientId: string
  date: string
  reason: string
  doneAt: string | null
  createdAt: string
}

export interface Reminder {
  id: string
  patientId: string
  date: string
  reason: string
  doneAt?: string
}

export interface ReminderRequest {
  date: string
  reason: string
}

export type DueKind = 'vaccination' | 'reminder'

export interface DueItemDto {
  kind: DueKind
  id: string
  patientId: string
  title: string
  dueOn: string
  contactedAt: string | null
  doneAt: string | null
}

export interface DueItem {
  kind: DueKind
  id: string
  patientId: string
  title: string
  dueOn: string
  contactedAt?: string
}

export type DueWindow = 'overdue' | 'week' | 'month' | 'year'

export interface CertificateAnimal extends AnimalDetails {
  chipNumber?: string
}

export interface CertificateSubject {
  animal: CertificateAnimal
  owner: OwnerDetails
}

export interface IssueCertificateRequest {
  number: string
  issuedOn: string
  animal: CertificateAnimal
  owner: OwnerDetails
  passportNumber?: string | null
  passportIssuedOn?: string | null
  chipImplantedOn?: string | null
  issuedBy: string
  vetName: string
  vetLicence?: string | null
}

export interface RabiesCertificate {
  id: string
  vaccinationId: string
  patientId: string
  number: string
  issuedOn: string
  animal: CertificateAnimal
  owner: OwnerDetails
  passportNumber: string | null
  passportIssuedOn: string | null
  chipImplantedOn: string | null
  vaccineName: string
  batch: string | null
  givenOn: string
  validUntil: string
  issuedBy: string
  vetName: string
  vetLicence: string | null
  createdAt: string
}

export interface CertificateIssuer {
  issuedBy?: string
  vetLicence?: string
}
