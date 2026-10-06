import {
  oneOf,
  parsePagedParams,
  trimmedParam,
  writePagedParams,
  type PagedListSpec,
} from '@/shared/lib/listParams'
import type { PatientFilters, PatientStatus, Sex, Species } from '../types'

export interface ParsedPatientParams {
  filters: PatientFilters
  allergenName?: string
  page: number
  pageSize: number
}

const SPECIES_VALUES: Species[] = ['dog', 'cat', 'bird', 'other']
const SEX_VALUES: Sex[] = ['male', 'female']

const SPEC: PagedListSpec<PatientStatus> = {
  statuses: ['active', 'all', 'deleted'],
  defaultStatus: 'active',
  pageSizes: [10, 20, 50],
  defaultPageSize: 10,
}

export function parseFilterParams(params: URLSearchParams): ParsedPatientParams {
  const { filters: paged, page, pageSize } = parsePagedParams(params, SPEC)
  const filters: PatientFilters = { ...paged }

  const species = oneOf(params.get('species'), SPECIES_VALUES)
  if (species) filters.species = species

  const sex = oneOf(params.get('sex'), SEX_VALUES)
  if (sex) filters.sex = sex

  const city = trimmedParam(params.get('city'))
  if (city) filters.city = city

  return { filters, allergenName: trimmedParam(params.get('allergen')), page, pageSize }
}

export function toFilterParams(
  filters: PatientFilters,
  page: number,
  pageSize: number,
): URLSearchParams {
  return writePagedParams(
    new URLSearchParams(),
    {
      filters: { search: filters.search, status: filters.status ?? SPEC.defaultStatus },
      page,
      pageSize,
    },
    SPEC,
    {
      species: filters.species,
      sex: filters.sex,
      allergen: filters.allergen?.name,
      city: filters.city,
    },
  )
}
