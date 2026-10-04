import { apiFetch } from '@/shared/lib/apiClient'
import { sexToApi, speciesToApi, statusToApi } from '../lib/enumMapping'
import { toPatientDetail, toPatientListItem } from '../lib/patientMapping'
import type {
  GetPatientsResponseDto,
  PatientDetail,
  PatientDetailDto,
  PatientFilters,
  PatientPage,
  PatientWriteRequest,
} from '../types'

export function buildPatientsQuery(
  filters: PatientFilters,
  page: number,
  pageSize: number,
): URLSearchParams {
  const params = new URLSearchParams()

  const search = filters.search?.trim()
  if (search) params.set('search', search)
  if (filters.species) params.set('species', String(speciesToApi(filters.species)))
  if (filters.sex) params.set('sex', String(sexToApi(filters.sex)))
  if (filters.allergen) params.set('allergenId', filters.allergen.id)
  if (filters.city) params.set('city', filters.city)

  params.set('status', String(statusToApi(filters.status ?? 'active')))
  params.set('page', String(page))
  params.set('pageSize', String(pageSize))

  return params
}

export async function getPatients(
  filters: PatientFilters,
  page: number,
  pageSize: number,
): Promise<PatientPage> {
  const query = buildPatientsQuery(filters, page, pageSize)
  const response = await apiFetch<GetPatientsResponseDto>(`/patients?${query.toString()}`)

  return {
    items: response.items.map(toPatientListItem),
    totalCount: response.totalCount,
    page: response.page,
    pageSize: response.pageSize,
  }
}

export async function getPatient(id: string): Promise<PatientDetail> {
  return toPatientDetail(await apiFetch<PatientDetailDto>(`/patients/${id}`))
}

export function createPatient(request: PatientWriteRequest): Promise<string> {
  return apiFetch<string>('/patients', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function updatePatient(id: string, request: PatientWriteRequest): Promise<void> {
  return apiFetch<void>(`/patients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  })
}

export function deletePatient(id: string): Promise<void> {
  return apiFetch<void>(`/patients/${id}`, { method: 'DELETE' })
}
