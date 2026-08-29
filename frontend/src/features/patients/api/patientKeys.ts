import type { PatientFilters } from '../types'

export const patientKeys = {
  all: ['patients'] as const,
  list: (filters: PatientFilters, page: number, pageSize: number) =>
    [...patientKeys.all, 'list', filters, page, pageSize] as const,
  detail: (id: string) => [...patientKeys.all, 'detail', id] as const,
}
