import type { PatientFilters, PatientStatus, Sex, Species } from '../types'

export interface ParsedPatientParams {
  filters: PatientFilters
  allergenName?: string
  page: number
  pageSize: number
}

const SPECIES_VALUES: Species[] = ['dog', 'cat', 'bird', 'other']
const SEX_VALUES: Sex[] = ['male', 'female']
const STATUS_VALUES: PatientStatus[] = ['active', 'all', 'deleted']
const PAGE_SIZES = [10, 20, 50]

const DEFAULT_STATUS: PatientStatus = 'active'
const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10

function oneOf<T extends string>(value: string | null, allowed: T[]): T | undefined {
  return value !== null && (allowed as string[]).includes(value) ? (value as T) : undefined
}

function text(value: string | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function positiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function parseFilterParams(params: URLSearchParams): ParsedPatientParams {
  const pageSize = positiveInt(params.get('pageSize'), DEFAULT_PAGE_SIZE)

  const filters: PatientFilters = {
    status: oneOf(params.get('status'), STATUS_VALUES) ?? DEFAULT_STATUS,
  }

  const search = text(params.get('search'))
  if (search) filters.search = search

  const species = oneOf(params.get('species'), SPECIES_VALUES)
  if (species) filters.species = species

  const sex = oneOf(params.get('sex'), SEX_VALUES)
  if (sex) filters.sex = sex

  const city = text(params.get('city'))
  if (city) filters.city = city

  return {
    filters,
    allergenName: text(params.get('allergen')),
    page: positiveInt(params.get('page'), DEFAULT_PAGE),
    pageSize: PAGE_SIZES.includes(pageSize) ? pageSize : DEFAULT_PAGE_SIZE,
  }
}

export function toFilterParams(
  filters: PatientFilters,
  page: number,
  pageSize: number,
): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.search) params.set('search', filters.search)
  if (filters.species) params.set('species', filters.species)
  if (filters.sex) params.set('sex', filters.sex)
  if (filters.allergen) params.set('allergen', filters.allergen.name)
  if (filters.city) params.set('city', filters.city)
  if (filters.status && filters.status !== DEFAULT_STATUS) params.set('status', filters.status)
  if (page !== DEFAULT_PAGE) params.set('page', String(page))
  if (pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(pageSize))

  return params
}
