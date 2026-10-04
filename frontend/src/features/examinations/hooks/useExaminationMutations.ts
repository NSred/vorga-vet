import { useMutation, useQueryClient } from '@tanstack/react-query'
import { examinationKeys } from '../api/examinationKeys'
import {
  createExamination,
  deleteAttachment,
  payExamination,
  updateExamination,
  uploadAttachment,
} from '../api/examinationsApi'
import type { AttachmentKind, CreateExaminationRequest, ExaminationDetails } from '../types'

export function useCreateExamination() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateExaminationRequest) => createExamination(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: examinationKeys.all }),
  })
}

export function usePayExamination() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => payExamination(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: examinationKeys.all }),
  })
}

export function useUpdateExamination() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, examination }: { id: string; examination: ExaminationDetails }) =>
      updateExamination(id, examination),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: examinationKeys.all }),
  })
}

export function useUploadAttachment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      examinationId,
      file,
      kind,
    }: {
      examinationId: string
      file: File
      kind: AttachmentKind
    }) => uploadAttachment(examinationId, file, kind),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: examinationKeys.all }),
  })
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      examinationId,
      attachmentId,
    }: {
      examinationId: string
      attachmentId: string
    }) => deleteAttachment(examinationId, attachmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: examinationKeys.all }),
  })
}
