import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getDiagnoses } from '../api/diagnosesApi'
import { diagnosisKeys } from '../api/diagnosisKeys'
import type { DiagnosisFilters } from '../types'

export function useDiagnosesQuery(filters: DiagnosisFilters, page: number, pageSize: number) {
  return useQuery({
    queryKey: diagnosisKeys.list(filters, page, pageSize),
    queryFn: () => getDiagnoses(filters, page, pageSize),
    placeholderData: keepPreviousData,
    meta: { errorTitle: 'Could not load the diagnoses' },
  })
}
