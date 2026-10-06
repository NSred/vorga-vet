import { getPatientExaminations } from '@/features/examinations'
import { getPatients, type PatientListItem } from '@/features/patients'
import { mapWithLimit } from '../lib/mapWithLimit'
import type { ReportRow } from '../types'

const PAGE_SIZE = 100
const PARALLEL_REQUESTS = 6

async function getEveryPatient(status: 'all' | 'deleted'): Promise<PatientListItem[]> {
  const patients: PatientListItem[] = []
  for (let page = 1; ; page += 1) {
    const result = await getPatients({ status }, page, PAGE_SIZE)
    patients.push(...result.items)
    if (result.items.length === 0 || page * PAGE_SIZE >= result.totalCount) return patients
  }
}

export function getDeletedPatients(): Promise<PatientListItem[]> {
  return getEveryPatient('deleted')
}

export async function getExaminationsAcrossPatients(): Promise<ReportRow[]> {
  const patients = await getEveryPatient('all')
  const perPatient = await mapWithLimit(patients, PARALLEL_REQUESTS, (patient) =>
    getPatientExaminations(patient.id),
  )
  return patients.flatMap((patient, index) =>
    perPatient[index].map((examination) => ({ examination, patient })),
  )
}
