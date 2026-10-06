import { settle } from '@/shared/lib/mockApi'
import type { CertificateIssuer, IssueCertificateRequest, RabiesCertificate } from '../types'
import {
  getCertificateForVaccination,
  issueCertificate,
  lastIssuer,
  listPatientCertificates,
} from './mockCertificatesStore'

export async function getPatientCertificates(patientId: string): Promise<RabiesCertificate[]> {
  await settle()
  return listPatientCertificates(patientId)
}

export async function issueRabiesCertificate(
  vaccinationId: string,
  request: IssueCertificateRequest,
): Promise<RabiesCertificate> {
  await settle()
  issueCertificate(vaccinationId, request)
  return getCertificateForVaccination(vaccinationId)
}

export async function getLastIssuer(): Promise<CertificateIssuer> {
  await settle()
  return lastIssuer()
}
