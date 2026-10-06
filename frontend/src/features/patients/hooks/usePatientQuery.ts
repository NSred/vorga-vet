import { queryOptions, useQuery } from '@tanstack/react-query'
import { patientKeys } from '../api/patientKeys'
import { getPatient } from '../api/patientsApi'

export function patientDetailQuery(patientId: string) {
  return queryOptions({
    queryKey: patientKeys.detail(patientId),
    queryFn: () => getPatient(patientId),
  })
}

export function usePatientQuery(patientId: string, enabled = true) {
  return useQuery({
    ...patientDetailQuery(patientId),
    enabled,
    meta: { errorTitle: 'Could not load the patient' },
  })
}
