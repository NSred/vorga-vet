import type { DiagnosisFilters, DiagnosisStatus } from '../types'

export interface ParsedDiagnosisParams {
  filters: DiagnosisFilters
  page: number
  pageSize: number
}

const STATUS_VALUES: DiagnosisStatus[] = ['active', 'all', 'retired']
export const DIAGNOSIS_PAGE_SIZES = [25, 50, 100]

const DEFAULT_STATUS: DiagnosisStatus = 'active'
const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 25
const OWNED_KEYS = ['search', 'status', 'page', 'pageSize']

function positiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function statusOf(value: string | null): DiagnosisStatus {
  return value !== null && (STATUS_VALUES as string[]).includes(value)
    ? (value as DiagnosisStatus)
    : DEFAULT_STATUS
}

export function parseDiagnosisParams(params: URLSearchParams): ParsedDiagnosisParams {
  const filters: DiagnosisFilters = { status: statusOf(params.get('status')) }
  const search = params.get('search')?.trim()
  if (search) filters.search = search

  const pageSize = positiveInt(params.get('pageSize'), DEFAULT_PAGE_SIZE)
  return {
    filters,
    page: positiveInt(params.get('page'), DEFAULT_PAGE),
    pageSize: DIAGNOSIS_PAGE_SIZES.includes(pageSize) ? pageSize : DEFAULT_PAGE_SIZE,
  }
}

export function writeDiagnosisParams(
  base: URLSearchParams,
  { filters, page, pageSize }: ParsedDiagnosisParams,
): URLSearchParams {
  const params = new URLSearchParams(base)
  for (const key of OWNED_KEYS) params.delete(key)

  if (filters.search) params.set('search', filters.search)
  if (filters.status !== DEFAULT_STATUS) params.set('status', filters.status)
  if (page !== DEFAULT_PAGE) params.set('page', String(page))
  if (pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(pageSize))

  return params
}
