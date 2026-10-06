import type { CatalogFilters, CatalogQueryDto, CatalogStatus } from '@/shared/domain/catalog'
import type { Page } from '@/shared/domain/page'
export type DiagnosisStatus = CatalogStatus

export interface DiagnosisDto {
  id: string
  code: string | null
  name: string
  isActive: boolean
  createdAt: string
}

export type DiagnosisPageDto = Page<DiagnosisDto>

export type DiagnosisQueryDto = CatalogQueryDto

export interface DiagnosisWriteRequest {
  name: string
  code?: string | null
}

export interface DiagnosisImportResult {
  added: number
  skipped: number
}

export interface Diagnosis {
  id: string
  name: string
  code?: string
  isActive: boolean
}

export type DiagnosisPage = Page<Diagnosis>

export type DiagnosisFilters = CatalogFilters

export interface DiagnosisFormValues {
  name: string
  code: string
}
