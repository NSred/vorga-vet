import { ApiError } from '@/shared/lib/apiClient'
import { clinicToday } from '@/shared/lib/clinicTime'
import type { CertificateIssuer, IssueCertificateRequest, RabiesCertificate } from '../types'
import { findVaccination } from './mockVaccinationsStore'
import { vaccinationErrors } from './vaccinationErrors'

export const CERTIFICATES_STORAGE_KEY = 'vorgavet.mock.certificates'

const STORE_VERSION = 1
const MAX_NUMBER_LENGTH = 20
const MAX_PASSPORT_LENGTH = 30
const MAX_NAME_LENGTH = 200
const MAX_LICENCE_LENGTH = 30
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

interface StoreState {
  version: number
  certificates: RabiesCertificate[]
}

let state: StoreState | null = null

function isStoreState(value: unknown): value is StoreState {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<StoreState>
  return candidate.version === STORE_VERSION && Array.isArray(candidate.certificates)
}

function readStorage(): StoreState | null {
  try {
    const raw = window.localStorage.getItem(CERTIFICATES_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isStoreState(parsed) ? parsed : null
  } catch {
    return null
  }
}

function load(): StoreState {
  state ??= readStorage() ?? { version: STORE_VERSION, certificates: [] }
  return state
}

function commit(): void {
  if (!state) return
  try {
    window.localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(state))
  } catch {
    return
  }
}

export function resetCertificatesStore(): void {
  state = null
  try {
    window.localStorage.removeItem(CERTIFICATES_STORAGE_KEY)
  } catch {
    return
  }
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `certificate-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function trimmedOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function optionalDateMessage(value: string | null | undefined, label: string): string[] {
  if (!value) return []
  if (!DATE_PATTERN.test(value)) return [`${label} must be a date.`]
  if (value > clinicToday()) return [`${label} cannot be in the future.`]
  return []
}

function copy(certificate: RabiesCertificate): RabiesCertificate {
  return {
    ...certificate,
    animal: { ...certificate.animal },
    owner: { ...certificate.owner },
  }
}

export function listPatientCertificates(patientId: string): RabiesCertificate[] {
  return load()
    .certificates.filter((certificate) => certificate.patientId === patientId)
    .map(copy)
}

export function getCertificateForVaccination(vaccinationId: string): RabiesCertificate {
  const certificate = load().certificates.find((item) => item.vaccinationId === vaccinationId)
  if (!certificate) {
    throw new ApiError(404, 'No certificate was issued.', vaccinationErrors.certificateNotFound)
  }
  return copy(certificate)
}

export function lastIssuer(): CertificateIssuer {
  const latest = [...load().certificates].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  if (!latest) return {}
  const issuer: CertificateIssuer = { issuedBy: latest.issuedBy }
  if (latest.vetLicence) issuer.vetLicence = latest.vetLicence
  return issuer
}

export function issueCertificate(vaccinationId: string, request: IssueCertificateRequest): string {
  const vaccination = findVaccination(vaccinationId)
  if (!vaccination) {
    throw new ApiError(404, 'The vaccination was not found.', vaccinationErrors.notFound)
  }
  if (!vaccination.isRabies) {
    throw new ApiError(
      400,
      'Only a rabies vaccination gets this certificate.',
      vaccinationErrors.certificateNotRabies,
    )
  }

  const current = load()
  if (current.certificates.some((item) => item.vaccinationId === vaccinationId)) {
    throw new ApiError(
      409,
      'A certificate was already issued for this vaccination.',
      vaccinationErrors.certificateAlreadyIssued,
    )
  }

  const number = request.number?.trim() ?? ''
  const messages: string[] = []
  if (!number) messages.push('Certificate number is required.')
  else if (number.length > MAX_NUMBER_LENGTH) messages.push('Certificate number is too long.')
  if (!DATE_PATTERN.test(request.issuedOn ?? '')) messages.push('Issued on must be a date.')
  else if (request.issuedOn < vaccination.givenOn || request.issuedOn > clinicToday()) {
    messages.push('Issued on must be between the vaccination and today.')
  }
  if ((request.passportNumber?.trim().length ?? 0) > MAX_PASSPORT_LENGTH) {
    messages.push('Passport number is too long.')
  }
  messages.push(...optionalDateMessage(request.passportIssuedOn, 'Passport issued on'))
  messages.push(...optionalDateMessage(request.chipImplantedOn, 'Microchip date'))
  for (const [value, label] of [
    [request.issuedBy, 'Issued by'],
    [request.vetName, 'Vet name'],
  ] as const) {
    const trimmed = value?.trim() ?? ''
    if (!trimmed) messages.push(`${label} is required.`)
    else if (trimmed.length > MAX_NAME_LENGTH) messages.push(`${label} is too long.`)
  }
  if ((request.vetLicence?.trim().length ?? 0) > MAX_LICENCE_LENGTH) {
    messages.push('Licence number is too long.')
  }
  if (messages.length > 0) {
    throw new ApiError(
      400,
      'One or more validation errors occurred.',
      vaccinationErrors.validation,
      messages,
    )
  }

  const normalized = number.toLocaleLowerCase()
  if (current.certificates.some((item) => item.number.toLocaleLowerCase() === normalized)) {
    throw new ApiError(
      409,
      'This certificate number was already used.',
      vaccinationErrors.certificateNumberNotUnique,
    )
  }

  const certificate: RabiesCertificate = {
    id: newId(),
    vaccinationId,
    patientId: vaccination.patientId,
    number,
    issuedOn: request.issuedOn,
    animal: { ...request.animal },
    owner: { ...request.owner },
    passportNumber: trimmedOrNull(request.passportNumber),
    passportIssuedOn: request.passportIssuedOn || null,
    chipImplantedOn: request.chipImplantedOn || null,
    vaccineName: vaccination.vaccineName,
    batch: vaccination.batch,
    givenOn: vaccination.givenOn,
    validUntil: vaccination.dueOn,
    issuedBy: request.issuedBy.trim(),
    vetName: request.vetName.trim(),
    vetLicence: trimmedOrNull(request.vetLicence),
    createdAt: new Date().toISOString(),
  }
  current.certificates.push(certificate)
  commit()
  return certificate.id
}
