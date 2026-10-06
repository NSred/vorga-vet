import type { DiagnosisFilters } from '../types'

export const diagnosisKeys = {
  all: ['diagnoses'] as const,
  list: (filters: DiagnosisFilters, page: number, pageSize: number) =>
    [...diagnosisKeys.all, 'list', filters, page, pageSize] as const,
  exact: (name: string) => [...diagnosisKeys.all, 'exact', name] as const,
}
