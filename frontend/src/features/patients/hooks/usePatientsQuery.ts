import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { searchAllergens } from '../api/allergensApi'
import { patientKeys } from '../api/patientKeys'
import { getPatients } from '../api/patientsApi'
import { getDashboardStats } from '../api/statsApi'
import type { AllergenOption, PatientFilters } from '../types'

export interface AllergenResolution {
  allergen: AllergenOption | null
  isPending: boolean
}

export function useAllergenByName(allergenName: string | undefined): AllergenResolution {
  const name = allergenName ?? ''

  const { data, isPending } = useQuery({
    queryKey: ['allergens', 'byName', name],
    queryFn: () => searchAllergens(name),
    enabled: name.length > 0,
    select: (results) =>
      results.find((candidate) => candidate.name.toLowerCase() === name.toLowerCase()) ?? null,
  })

  if (name.length === 0) {
    return { allergen: null, isPending: false }
  }

  return { allergen: data ?? null, isPending }
}

export function usePatientsQuery(
  filters: PatientFilters,
  page: number,
  pageSize: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: patientKeys.list(filters, page, pageSize),
    queryFn: () => getPatients(filters, page, pageSize),
    enabled,
    placeholderData: keepPreviousData,
  })
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['stats', 'dashboard'],
    queryFn: getDashboardStats,
  })
}
