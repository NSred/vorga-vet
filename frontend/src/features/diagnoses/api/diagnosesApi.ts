import { statusToApi, toDiagnosisPage } from '../lib/diagnosisMapping'
import type {
  DiagnosisFilters,
  DiagnosisImportResult,
  DiagnosisPage,
  DiagnosisQueryDto,
  DiagnosisWriteRequest,
} from '../types'
import {
  createDiagnosis,
  importDiagnoses,
  listDiagnoses,
  setDiagnosisActive,
  updateDiagnosis,
} from './mockDiagnosesStore'

const MOCK_DELAY_MS = import.meta.env.MODE === 'test' ? 0 : 150

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
}

export function buildDiagnosisQuery(
  filters: DiagnosisFilters,
  page: number,
  pageSize: number,
): DiagnosisQueryDto {
  const query: DiagnosisQueryDto = { status: statusToApi(filters.status), page, pageSize }
  const search = filters.search?.trim()
  if (search) query.search = search
  return query
}

export async function getDiagnoses(
  filters: DiagnosisFilters,
  page: number,
  pageSize: number,
): Promise<DiagnosisPage> {
  await settle()
  return toDiagnosisPage(listDiagnoses(buildDiagnosisQuery(filters, page, pageSize)))
}

export async function addDiagnosis(request: DiagnosisWriteRequest): Promise<string> {
  await settle()
  return createDiagnosis(request)
}

export async function editDiagnosis(id: string, request: DiagnosisWriteRequest): Promise<void> {
  await settle()
  updateDiagnosis(id, request)
}

export async function retireDiagnosis(id: string): Promise<void> {
  await settle()
  setDiagnosisActive(id, false)
}

export async function restoreDiagnosis(id: string): Promise<void> {
  await settle()
  setDiagnosisActive(id, true)
}

export async function importDiagnosisNames(names: string[]): Promise<DiagnosisImportResult> {
  await settle()
  return importDiagnoses(names)
}
