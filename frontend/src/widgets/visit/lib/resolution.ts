import type { Appointment, CheckInRequest } from '@/features/appointments'
import { generatePatientCardNumber, sexToApi } from '@/features/patients'
import type { BreedOption, OwnerOption, PatientListItem, Sex, Species } from '@/features/patients'

export interface NewPatientValues {
  species: Species
  breed: BreedOption | null
  name: string
  sex: Sex
  cardNumber: string
  birthDate: string
  color: string
  chipNumber: string
  note: string
}

export type PatientMode = 'existing' | 'new'

export interface ResolutionValues {
  owner: OwnerOption | null
  patientMode: PatientMode
  patient: PatientListItem | null
  newPatient: NewPatientValues
}

export interface ResolutionNeeds {
  owner: boolean
  patient: boolean
}

export interface ResolutionErrors {
  owner?: string
  patient?: string
  breed?: string
  name?: string
  cardNumber?: string
}

export function needsFor(appointment: Appointment): ResolutionNeeds {
  return { owner: !appointment.ownerId, patient: !appointment.patientId }
}

export function needsAnything(needs: ResolutionNeeds): boolean {
  return needs.owner || needs.patient
}

export function emptyNewPatient(species: Species = 'dog'): NewPatientValues {
  return {
    species,
    breed: null,
    name: '',
    sex: 'male',
    cardNumber: generatePatientCardNumber(species),
    birthDate: '',
    color: '',
    chipNumber: '',
    note: '',
  }
}

export function emptyResolution(): ResolutionValues {
  return { owner: null, patientMode: 'existing', patient: null, newPatient: emptyNewPatient() }
}

function trimmed(value: string): string | undefined {
  const text = value.trim()
  return text ? text : undefined
}

export function validateResolution(
  values: ResolutionValues,
  needs: ResolutionNeeds,
): ResolutionErrors {
  const errors: ResolutionErrors = {}

  if (needs.owner && !values.owner) {
    errors.owner = 'Pick or create the owner'
  }

  if (needs.patient) {
    if (values.patientMode === 'existing') {
      if (!values.patient) errors.patient = 'Pick the patient or enter a new card'
    } else {
      if (!values.newPatient.name.trim()) errors.name = 'Name is required'
      if (!values.newPatient.breed) errors.breed = 'Breed is required'
      if (!values.newPatient.cardNumber.trim()) errors.cardNumber = 'No. is required'
    }
  }

  return errors
}

export function hasErrors(errors: ResolutionErrors): boolean {
  return Object.keys(errors).length > 0
}

export function toResolution(values: ResolutionValues, needs: ResolutionNeeds): CheckInRequest {
  const request: CheckInRequest = {}

  if (needs.owner && values.owner) {
    request.owner = { existingOwnerId: values.owner.id }
  }

  if (needs.patient) {
    if (values.patientMode === 'existing' && values.patient) {
      request.patient = { existingPatientId: values.patient.id }
    }

    if (values.patientMode === 'new' && values.newPatient.breed) {
      const details = values.newPatient
      request.patient = {
        create: {
          breedId: details.breed!.id,
          cardNumber: details.cardNumber.trim(),
          name: details.name.trim(),
          sex: sexToApi(details.sex),
          birthDate: trimmed(details.birthDate),
          color: trimmed(details.color),
          chipNumber: trimmed(details.chipNumber),
          note: trimmed(details.note),
        },
      }
    }
  }

  return request
}
