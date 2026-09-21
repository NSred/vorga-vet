import { apiFetch } from '@/shared/lib/apiClient'
import { toExamination } from '../lib/examinationMapping'
import type { CreateExaminationRequest, Examination, ExaminationDto } from '../types'

export async function getExamination(id: string): Promise<Examination> {
  return toExamination(await apiFetch<ExaminationDto>(`/examinations/${id}`))
}

export function createExamination(request: CreateExaminationRequest): Promise<string> {
  return apiFetch<string>('/examinations', { method: 'POST', body: JSON.stringify(request) })
}

export function payExamination(id: string): Promise<void> {
  return apiFetch<void>(`/examinations/${id}/pay`, { method: 'POST', body: '{}' })
}
