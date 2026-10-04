import { useQuery } from '@tanstack/react-query'
import { patientKeys } from '../api/patientKeys'
import { getPatients } from '../api/patientsApi'
import type { PatientFilters } from '../types'

const ACTIVE_FILTERS: PatientFilters = { status: 'active' }
const ACTIVE_PAGE = 1
const ACTIVE_PAGE_SIZE = 10

export interface ActivePatientCount {
  count: number
  isPending: boolean
}

export function useActivePatientCount(): ActivePatientCount {
  const { data, isPending } = useQuery({
    queryKey: patientKeys.list(ACTIVE_FILTERS, ACTIVE_PAGE, ACTIVE_PAGE_SIZE),
    queryFn: () => getPatients(ACTIVE_FILTERS, ACTIVE_PAGE, ACTIVE_PAGE_SIZE),
  })

  return { count: data?.totalCount ?? 0, isPending }
}
