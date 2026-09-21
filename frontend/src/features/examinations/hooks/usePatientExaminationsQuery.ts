import { useQuery } from '@tanstack/react-query'
import { examinationKeys } from '../api/examinationKeys'
import { getPatientExaminations } from '../api/examinationsApi'

export function usePatientExaminationsQuery(patientId: string, enabled = true) {
  return useQuery({
    queryKey: examinationKeys.forPatient(patientId),
    queryFn: () => getPatientExaminations(patientId),
    enabled,
    meta: { errorTitle: 'Could not load the visit history' },
  })
}
