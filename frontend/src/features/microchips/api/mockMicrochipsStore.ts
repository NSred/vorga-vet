import { ApiError } from '@/shared/lib/apiClient'
import { clinicToday } from '@/shared/lib/clinicTime'
import { assertValid } from '@/shared/lib/mockApi'
import { createMockStore, newId } from '@/shared/lib/mockStore'
import { isDateOnly, requiredTextMessages } from '@/shared/lib/validation'
import type { MicrochipRegistration, RegisterMicrochipRequest, Sterilised } from '../types'
import { microchipErrors } from './microchipErrors'

export const MICROCHIPS_STORAGE_KEY = 'vorgavet.mock.microchips'

const CHIP_PATTERN = /^[\d ]{10,20}$/
const MAX_NAME_LENGTH = 200
const STERILISED: Sterilised[] = ['yes', 'no', 'unknown']

const store = createMockStore<{ registrations: MicrochipRegistration[] }>({
  key: MICROCHIPS_STORAGE_KEY,
  version: 1,
  isValid: (value) => Array.isArray(value.registrations),
  initial: () => ({ registrations: [] }),
})

export const resetMicrochipsStore = store.reset

function compact(chipNumber: string): string {
  return chipNumber.replace(/\s/g, '')
}

function copy(registration: MicrochipRegistration): MicrochipRegistration {
  return {
    ...registration,
    animal: { ...registration.animal },
    owner: { ...registration.owner },
    lastRabies: registration.lastRabies ? { ...registration.lastRabies } : null,
  }
}

function newestFirst(a: MicrochipRegistration, b: MicrochipRegistration): number {
  return b.createdAt.localeCompare(a.createdAt)
}

export function listPatientRegistrations(patientId: string): MicrochipRegistration[] {
  return store
    .state()
    .registrations.filter((registration) => registration.patientId === patientId)
    .sort(newestFirst)
    .map(copy)
}

export function lastClinic(): { clinic?: string } {
  const latest = [...store.state().registrations].sort(newestFirst)[0]
  return latest ? { clinic: latest.clinic } : {}
}

function validate(request: RegisterMicrochipRequest, chipNumber: string): void {
  const messages: string[] = []
  if (!CHIP_PATTERN.test(chipNumber)) messages.push('Chip number must be 10 to 20 digits.')
  if (!isDateOnly(request.implantedOn)) messages.push('Implanted on must be a date.')
  else if (request.implantedOn > clinicToday())
    messages.push('Implanted on cannot be in the future.')
  if (!STERILISED.includes(request.sterilised))
    messages.push('Sterilised must be yes, no or unknown.')
  messages.push(
    ...requiredTextMessages(
      [
        [request.clinic, 'Clinic'],
        [request.vetName, 'Vet name'],
      ],
      MAX_NAME_LENGTH,
    ),
  )
  assertValid(messages)
}

export function registerMicrochip(patientId: string, request: RegisterMicrochipRequest): string {
  const chipNumber = request.chipNumber?.trim() ?? ''
  validate(request, chipNumber)

  const { registrations } = store.state()
  if (registrations.some((item) => compact(item.chipNumber) === compact(chipNumber))) {
    throw new ApiError(409, 'This chip is already registered.', microchipErrors.alreadyRegistered)
  }

  const registration: MicrochipRegistration = {
    id: newId('registration'),
    patientId,
    chipNumber,
    implantedOn: request.implantedOn,
    sterilised: request.sterilised,
    consentToPublish: Boolean(request.consentToPublish),
    animal: {
      name: request.animal.name,
      species: request.animal.species,
      breed: request.animal.breed,
      sex: request.animal.sex,
      birthDate: request.animal.birthDate,
      color: request.animal.color,
    },
    owner: {
      name: request.owner.name,
      address: request.owner.address,
      city: request.owner.city,
      phone: request.owner.phone,
    },
    lastRabies: request.lastRabies
      ? { vaccineName: request.lastRabies.vaccineName, givenOn: request.lastRabies.givenOn }
      : null,
    clinic: request.clinic.trim(),
    vetName: request.vetName.trim(),
    createdAt: new Date().toISOString(),
  }
  registrations.push(registration)
  store.commit()
  return registration.id
}
