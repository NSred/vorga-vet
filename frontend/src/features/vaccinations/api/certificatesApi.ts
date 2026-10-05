import type { CertificateIssuer, IssueCertificateRequest, RabiesCertificate } from '../types'
import {
  getCertificateForVaccination,
  issueCertificate,
  lastIssuer,
  listPatientCertificates,
} from './mockCertificatesStore'

const MOCK_DELAY_MS = import.meta.env.MODE === 'test' ? 0 : 150

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
}

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
