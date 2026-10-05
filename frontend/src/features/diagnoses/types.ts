export type DiagnosisStatus = 'active' | 'all' | 'retired'

export interface DiagnosisDto {
  id: string
  code: string | null
  name: string
  isActive: boolean
  createdAt: string
}

export interface DiagnosisPageDto {
  items: DiagnosisDto[]
  totalCount: number
  page: number
  pageSize: number
}

export interface DiagnosisQueryDto {
  search?: string
  status: number
  page: number
  pageSize: number
}

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

export interface DiagnosisPage {
  items: Diagnosis[]
  totalCount: number
  page: number
  pageSize: number
}

export interface DiagnosisFilters {
  search?: string
  status: DiagnosisStatus
}

export interface DiagnosisFormValues {
  name: string
  code: string
}
