import type { AnimalDetails, OwnerDetails } from '@/shared/domain/animal'

export type Sterilised = 'yes' | 'no' | 'unknown'

export interface RegistrationSubject {
  chipNumber?: string
  animal: AnimalDetails
  owner: OwnerDetails
}

export interface LastRabies {
  vaccineName: string
  givenOn: string
}

export interface RegisterMicrochipRequest {
  chipNumber: string
  implantedOn: string
  sterilised: Sterilised
  consentToPublish: boolean
  animal: AnimalDetails
  owner: OwnerDetails
  lastRabies?: LastRabies | null
  clinic: string
  vetName: string
}

export interface MicrochipRegistration {
  id: string
  patientId: string
  chipNumber: string
  implantedOn: string
  sterilised: Sterilised
  consentToPublish: boolean
  animal: AnimalDetails
  owner: OwnerDetails
  lastRabies: LastRabies | null
  clinic: string
  vetName: string
  createdAt: string
}
