import { useCallback } from 'react'
import { usePagedEntitySearch } from '@/shared/lib/useEntitySearch'
import { getDiagnoses } from '../api/diagnosesApi'
import { diagnosisKeys } from '../api/diagnosisKeys'

const PICKER_PAGE_SIZE = 15

export function useDiagnosisSearch() {
  const fetchPage = useCallback(
    (search: string, page: number) =>
      getDiagnoses(
        { search: search.trim() || undefined, status: 'active' },
        page,
        PICKER_PAGE_SIZE,
      ),
    [],
  )

  return usePagedEntitySearch(diagnosisKeys.all, fetchPage)
}
