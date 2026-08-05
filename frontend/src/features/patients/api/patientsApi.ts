import { simulateLatency } from '@/shared/lib/simulateLatency'
import { patients } from './mockData'
import type { Patient, PatientFilters, PatientInput } from '../types'

export function generatePatientCardNumber(): string {
  return String(Math.floor(10000 + Math.random() * 90000))
}

function matchesFilters(patient: Patient, filters?: PatientFilters): boolean {
  if (!filters) return true

  const status = filters.status ?? 'active'
  if (status !== 'all' && patient.cardStatus !== status) return false

  if (filters.search) {
    const needle = filters.search.toLowerCase()
    const haystack = [
      patient.ownerName,
      patient.name,
      patient.breed,
      patient.phone,
      patient.chipNumber,
      patient.address,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(needle)) return false
  }

  if (filters.species && filters.species !== 'all' && patient.species !== filters.species) {
    return false
  }
  if (filters.sex && filters.sex !== 'all' && patient.sex !== filters.sex) {
    return false
  }
  if (filters.allergies && filters.allergies !== 'all' && patient.allergies !== filters.allergies) {
    return false
  }
  if (filters.city && filters.city !== 'all' && patient.city !== filters.city) {
    return false
  }
  if (filters.debtorsOnly) {
    const balance = (patient.totalServicesRsd ?? 0) - (patient.paidRsd ?? 0)
    if (balance <= 0) return false
  }

  return true
}

export function getPatients(filters?: PatientFilters): Promise<Patient[]> {
  return simulateLatency(patients.filter((patient) => matchesFilters(patient, filters)))
}

export async function getPatient(id: string): Promise<Patient> {
  const patient = patients.find((item) => item.id === id)
  if (!patient) {
    throw new Error(`Patient ${id} not found`)
  }
  return simulateLatency(patient)
}

export async function createPatient(input: PatientInput): Promise<Patient> {
  const patient: Patient = {
    ...input,
    id: crypto.randomUUID(),
    cardStatus: 'active',
    visits: [],
  }
  patients.unshift(patient)
  return simulateLatency(patient)
}

export async function updatePatient(id: string, input: PatientInput): Promise<Patient> {
  const index = patients.findIndex((item) => item.id === id)
  if (index === -1) {
    throw new Error(`Patient ${id} not found`)
  }
  const updated: Patient = { ...patients[index], ...input, id, visits: patients[index].visits }
  patients[index] = updated
  return simulateLatency(updated)
}

export async function softDeletePatient(id: string): Promise<void> {
  const index = patients.findIndex((item) => item.id === id)
  if (index === -1) {
    throw new Error(`Patient ${id} not found`)
  }
  patients[index] = { ...patients[index], cardStatus: 'deleted' }
  await simulateLatency(undefined)
}
