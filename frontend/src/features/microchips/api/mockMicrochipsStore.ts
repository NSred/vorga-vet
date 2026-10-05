import { ApiError } from '@/shared/lib/apiClient'
import { clinicToday } from '@/shared/lib/clinicTime'
import type { MicrochipRegistration, RegisterMicrochipRequest, Sterilised } from '../types'
import { microchipErrors } from './microchipErrors'

export const MICROCHIPS_STORAGE_KEY = 'vorgavet.mock.microchips'

const STORE_VERSION = 1
const CHIP_PATTERN = /^[\d ]{10,20}$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MAX_NAME_LENGTH = 200
const STERILISED: Sterilised[] = ['yes', 'no', 'unknown']

interface StoreState {
  version: number
  registrations: MicrochipRegistration[]
}

let state: StoreState | null = null

function isStoreState(value: unknown): value is StoreState {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<StoreState>
  return candidate.version === STORE_VERSION && Array.isArray(candidate.registrations)
}

function readStorage(): StoreState | null {
  try {
    const raw = window.localStorage.getItem(MICROCHIPS_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isStoreState(parsed) ? parsed : null
  } catch {
    return null
  }
}

function load(): StoreState {
  state ??= readStorage() ?? { version: STORE_VERSION, registrations: [] }
  return state
}

function commit(): void {
  if (!state) return
  try {
    window.localStorage.setItem(MICROCHIPS_STORAGE_KEY, JSON.stringify(state))
  } catch {
    return
  }
}

export function resetMicrochipsStore(): void {
  state = null
  try {
    window.localStorage.removeItem(MICROCHIPS_STORAGE_KEY)
  } catch {
    return
  }
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `registration-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

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

export function listPatientRegistrations(patientId: string): MicrochipRegistration[] {
  return load()
    .registrations.filter((registration) => registration.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(copy)
}

export function lastClinic(): { clinic?: string } {
  const latest = [...load().registrations].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  return latest ? { clinic: latest.clinic } : {}
}

export function registerMicrochip(patientId: string, request: RegisterMicrochipRequest): string {
  const chipNumber = request.chipNumber?.trim() ?? ''
  const messages: string[] = []
  if (!CHIP_PATTERN.test(chipNumber)) {
    messages.push('Chip number must be 10 to 20 digits.')
  }
  if (!DATE_PATTERN.test(request.implantedOn ?? '')) messages.push('Implanted on must be a date.')
  else if (request.implantedOn > clinicToday())
    messages.push('Implanted on cannot be in the future.')
  if (!STERILISED.includes(request.sterilised))
    messages.push('Sterilised must be yes, no or unknown.')
  for (const [value, label] of [
    [request.clinic, 'Clinic'],
    [request.vetName, 'Vet name'],
  ] as const) {
    const trimmed = value?.trim() ?? ''
    if (!trimmed) messages.push(`${label} is required.`)
    else if (trimmed.length > MAX_NAME_LENGTH) messages.push(`${label} is too long.`)
  }
  if (messages.length > 0) {
    throw new ApiError(
      400,
      'One or more validation errors occurred.',
      microchipErrors.validation,
      messages,
    )
  }

  const current = load()
  if (current.registrations.some((item) => compact(item.chipNumber) === compact(chipNumber))) {
    throw new ApiError(409, 'This chip is already registered.', microchipErrors.alreadyRegistered)
  }

  const registration: MicrochipRegistration = {
    id: newId(),
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
  current.registrations.push(registration)
  commit()
  return registration.id
}
