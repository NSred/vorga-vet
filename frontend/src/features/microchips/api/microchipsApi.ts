import type { MicrochipRegistration, RegisterMicrochipRequest } from '../types'
import { lastClinic, listPatientRegistrations, registerMicrochip } from './mockMicrochipsStore'

const MOCK_DELAY_MS = import.meta.env.MODE === 'test' ? 0 : 150

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
}

export async function getPatientRegistrations(patientId: string): Promise<MicrochipRegistration[]> {
  await settle()
  return listPatientRegistrations(patientId)
}

export async function createRegistration(
  patientId: string,
  request: RegisterMicrochipRequest,
): Promise<MicrochipRegistration> {
  await settle()
  const id = registerMicrochip(patientId, request)
  const created = listPatientRegistrations(patientId).find((registration) => registration.id === id)
  if (!created) throw new Error('The registration was not saved.')
  return created
}

export async function getLastClinic(): Promise<{ clinic?: string }> {
  await settle()
  return lastClinic()
}
