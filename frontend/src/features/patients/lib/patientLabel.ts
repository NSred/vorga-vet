import type { PatientListItem } from '../types'

export function patientLabel(patient: PatientListItem): string {
  return `${patient.name} · ${patient.ownerName}`
}
