import { apiFetch, apiFetchBlob } from '@/shared/lib/apiClient'
import { attachmentKindToApi, toExamination } from '../lib/examinationMapping'
import type {
  AttachmentKind,
  CreateExaminationRequest,
  Examination,
  ExaminationDetails,
  ExaminationDto,
} from '../types'

export async function getExamination(id: string): Promise<Examination> {
  return toExamination(await apiFetch<ExaminationDto>(`/examinations/${id}`))
}

export function createExamination(request: CreateExaminationRequest): Promise<string> {
  return apiFetch<string>('/examinations', { method: 'POST', body: JSON.stringify(request) })
}

export function payExamination(id: string): Promise<void> {
  return apiFetch<void>(`/examinations/${id}/pay`, { method: 'POST', body: '{}' })
}

export async function getPatientExaminations(patientId: string): Promise<Examination[]> {
  const response = await apiFetch<ExaminationDto[]>(`/patients/${patientId}/examinations`)

  return response.map(toExamination)
}

export function updateExamination(id: string, examination: ExaminationDetails): Promise<void> {
  return apiFetch<void>(`/examinations/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ examination }),
  })
}

export function uploadAttachment(
  examinationId: string,
  file: File,
  kind: AttachmentKind,
): Promise<string> {
  const body = new FormData()
  body.append('file', file)
  body.append('kind', String(attachmentKindToApi(kind)))

  return apiFetch<string>(`/examinations/${examinationId}/attachments`, { method: 'POST', body })
}

export function deleteAttachment(examinationId: string, attachmentId: string): Promise<void> {
  return apiFetch<void>(`/examinations/${examinationId}/attachments/${attachmentId}`, {
    method: 'DELETE',
  })
}

export function getAttachmentBlob(attachmentId: string): Promise<Blob> {
  return apiFetchBlob(`/attachments/${attachmentId}`)
}
