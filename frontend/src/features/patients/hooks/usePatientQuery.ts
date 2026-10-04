import { useQuery } from '@tanstack/react-query'
import { patientKeys } from '../api/patientKeys'
import { getPatient } from '../api/patientsApi'

export function usePatientQuery(patientId: string, enabled = true) {
  return useQuery({
    queryKey: patientKeys.detail(patientId),
    queryFn: () => getPatient(patientId),
    enabled,
    meta: { errorTitle: 'Could not load the patient' },
  })
}
