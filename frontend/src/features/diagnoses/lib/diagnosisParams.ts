import {
  parsePagedParams,
  writePagedParams,
  type PagedListSpec,
  type PagedView,
} from '@/shared/lib/listParams'
import type { DiagnosisStatus } from '../types'

export type ParsedDiagnosisParams = PagedView<DiagnosisStatus>

export const DIAGNOSIS_PAGE_SIZES = [25, 50, 100]

const SPEC: PagedListSpec<DiagnosisStatus> = {
  statuses: ['active', 'all', 'retired'],
  defaultStatus: 'active',
  pageSizes: DIAGNOSIS_PAGE_SIZES,
  defaultPageSize: 25,
}

export function parseDiagnosisParams(params: URLSearchParams): ParsedDiagnosisParams {
  return parsePagedParams(params, SPEC)
}

export function writeDiagnosisParams(
  base: URLSearchParams,
  view: ParsedDiagnosisParams,
): URLSearchParams {
  return writePagedParams(base, view, SPEC)
}
