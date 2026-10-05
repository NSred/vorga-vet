import type {
  Diagnosis,
  DiagnosisDto,
  DiagnosisFormValues,
  DiagnosisPage,
  DiagnosisPageDto,
  DiagnosisStatus,
  DiagnosisWriteRequest,
} from '../types'

const STATUS_TO_API: Record<DiagnosisStatus, number> = { active: 0, all: 1, retired: 2 }

export function statusToApi(status: DiagnosisStatus): number {
  return STATUS_TO_API[status]
}

export function toDiagnosis(dto: DiagnosisDto): Diagnosis {
  const diagnosis: Diagnosis = { id: dto.id, name: dto.name, isActive: dto.isActive }
  if (dto.code) diagnosis.code = dto.code
  return diagnosis
}

export function toDiagnosisPage(dto: DiagnosisPageDto): DiagnosisPage {
  return {
    items: dto.items.map(toDiagnosis),
    totalCount: dto.totalCount,
    page: dto.page,
    pageSize: dto.pageSize,
  }
}

export function emptyDiagnosisValues(name = ''): DiagnosisFormValues {
  return { name, code: '' }
}

export function diagnosisValuesOf(diagnosis: Diagnosis): DiagnosisFormValues {
  return { name: diagnosis.name, code: diagnosis.code ?? '' }
}

export function toDiagnosisRequest(values: DiagnosisFormValues): DiagnosisWriteRequest {
  return { name: values.name.trim(), code: values.code.trim() || null }
}

export function splitPastedNames(text: string): string[] {
  const seen = new Set<string>()
  const names: string[] = []
  for (const line of text.split(/\r?\n/)) {
    const name = line.trim()
    const key = name.toLocaleLowerCase()
    if (!name || seen.has(key)) continue
    seen.add(key)
    names.push(name)
  }
  return names
}
