import { settle } from '@/shared/lib/mockApi'
import { toCatalogQuery } from '@/shared/domain/catalog'
import { toDiagnosisPage } from '../lib/diagnosisMapping'
import type {
  DiagnosisFilters,
  DiagnosisImportResult,
  DiagnosisPage,
  DiagnosisWriteRequest,
} from '../types'
import {
  createDiagnosis,
  importDiagnoses,
  listDiagnoses,
  setDiagnosisActive,
  updateDiagnosis,
} from './mockDiagnosesStore'

export async function getDiagnoses(
  filters: DiagnosisFilters,
  page: number,
  pageSize: number,
): Promise<DiagnosisPage> {
  await settle()
  return toDiagnosisPage(listDiagnoses(toCatalogQuery(filters, page, pageSize)))
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
