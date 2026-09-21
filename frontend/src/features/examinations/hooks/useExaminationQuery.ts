import { useQuery } from '@tanstack/react-query'
import { examinationKeys } from '../api/examinationKeys'
import { getExamination } from '../api/examinationsApi'

export function useExaminationQuery(id: string | null) {
  return useQuery({
    queryKey: examinationKeys.detail(id ?? ''),
    queryFn: () => getExamination(id ?? ''),
    enabled: id !== null,
    meta: { errorTitle: 'Could not load the examination' },
  })
}
