import { ApiError } from '@/shared/lib/apiClient'
import { clinicToday } from '@/shared/lib/clinicTime'
import { assertValid } from '@/shared/lib/mockApi'
import { createMockStore, newId } from '@/shared/lib/mockStore'
import {
  isDateOnly,
  requiredTextMessages,
  trimmedLength,
  trimmedOrNull,
} from '@/shared/lib/validation'
import type {
  CertificateIssuer,
  IssueCertificateRequest,
  RabiesCertificate,
  VaccinationDto,
} from '../types'
import { findVaccination } from './mockVaccinationsStore'
import { vaccinationErrors } from './vaccinationErrors'

export const CERTIFICATES_STORAGE_KEY = 'vorgavet.mock.certificates'

const MAX_NUMBER_LENGTH = 20
const MAX_PASSPORT_LENGTH = 30
const MAX_NAME_LENGTH = 200
const MAX_LICENCE_LENGTH = 30

const store = createMockStore<{ certificates: RabiesCertificate[] }>({
  key: CERTIFICATES_STORAGE_KEY,
  version: 1,
  isValid: (value) => Array.isArray(value.certificates),
  initial: () => ({ certificates: [] }),
})

export const resetCertificatesStore = store.reset

function certificates(): RabiesCertificate[] {
  return store.state().certificates
}

function optionalDateMessage(value: string | null | undefined, label: string): string[] {
  if (!value) return []
  if (!isDateOnly(value)) return [`${label} must be a date.`]
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
  return certificates()
    .filter((certificate) => certificate.patientId === patientId)
    .map(copy)
}

export function getCertificateForVaccination(vaccinationId: string): RabiesCertificate {
  const certificate = certificates().find((item) => item.vaccinationId === vaccinationId)
  if (!certificate) {
    throw new ApiError(404, 'No certificate was issued.', vaccinationErrors.certificateNotFound)
  }
  return copy(certificate)
}

export function lastIssuer(): CertificateIssuer {
  const latest = [...certificates()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  if (!latest) return {}
  const issuer: CertificateIssuer = { issuedBy: latest.issuedBy }
  if (latest.vetLicence) issuer.vetLicence = latest.vetLicence
  return issuer
}

function validate(request: IssueCertificateRequest, number: string, givenOn: string): void {
  const messages: string[] = []
  if (!number) messages.push('Certificate number is required.')
  else if (number.length > MAX_NUMBER_LENGTH) messages.push('Certificate number is too long.')
  if (!isDateOnly(request.issuedOn)) messages.push('Issued on must be a date.')
  else if (request.issuedOn < givenOn || request.issuedOn > clinicToday()) {
    messages.push('Issued on must be between the vaccination and today.')
  }
  if (trimmedLength(request.passportNumber) > MAX_PASSPORT_LENGTH) {
    messages.push('Passport number is too long.')
  }
  messages.push(...optionalDateMessage(request.passportIssuedOn, 'Passport issued on'))
  messages.push(...optionalDateMessage(request.chipImplantedOn, 'Microchip date'))
  messages.push(
    ...requiredTextMessages(
      [
        [request.issuedBy, 'Issued by'],
        [request.vetName, 'Vet name'],
      ],
      MAX_NAME_LENGTH,
    ),
  )
  if (trimmedLength(request.vetLicence) > MAX_LICENCE_LENGTH) {
    messages.push('Licence number is too long.')
  }
  assertValid(messages)
}

function rabiesVaccination(vaccinationId: string): VaccinationDto {
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
  return vaccination
}

export function issueCertificate(vaccinationId: string, request: IssueCertificateRequest): string {
  const vaccination = rabiesVaccination(vaccinationId)

  if (certificates().some((item) => item.vaccinationId === vaccinationId)) {
    throw new ApiError(
      409,
      'A certificate was already issued for this vaccination.',
      vaccinationErrors.certificateAlreadyIssued,
    )
  }

  const number = request.number?.trim() ?? ''
  validate(request, number, vaccination.givenOn)

  const normalized = number.toLocaleLowerCase()
  if (certificates().some((item) => item.number.toLocaleLowerCase() === normalized)) {
    throw new ApiError(
      409,
      'This certificate number was already used.',
      vaccinationErrors.certificateNumberNotUnique,
    )
  }

  const certificate: RabiesCertificate = {
    id: newId('certificate'),
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
  certificates().push(certificate)
  store.commit()
  return certificate.id
}
