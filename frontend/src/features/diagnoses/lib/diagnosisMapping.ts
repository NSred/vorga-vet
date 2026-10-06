import { mapPage } from '@/shared/domain/page'
import type {
  Diagnosis,
  DiagnosisDto,
  DiagnosisFormValues,
  DiagnosisPage,
  DiagnosisPageDto,
  DiagnosisWriteRequest,
} from '../types'

export { catalogStatusToApi as statusToApi } from '@/shared/domain/catalog'

export function toDiagnosis(dto: DiagnosisDto): Diagnosis {
  const diagnosis: Diagnosis = { id: dto.id, name: dto.name, isActive: dto.isActive }
  if (dto.code) diagnosis.code = dto.code
  return diagnosis
}

export function toDiagnosisPage(dto: DiagnosisPageDto): DiagnosisPage {
  return mapPage(dto, toDiagnosis)
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
