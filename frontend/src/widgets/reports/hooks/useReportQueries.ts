import { useQuery } from '@tanstack/react-query'
import { reportKeys } from '../api/reportKeys'
import { getDeletedPatients, getExaminationsAcrossPatients } from '../api/reportsApi'

export function useReportRows() {
  return useQuery({
    queryKey: reportKeys.examinations(),
    queryFn: getExaminationsAcrossPatients,
    meta: { errorTitle: 'Could not load the report' },
  })
}

export function useDeletedPatients() {
  return useQuery({
    queryKey: reportKeys.deletedPatients(),
    queryFn: getDeletedPatients,
    meta: { errorTitle: 'Could not load the deleted cards' },
  })
}
