import { useMutation, useQueryClient } from '@tanstack/react-query'
import { examinationKeys } from '../api/examinationKeys'
import { createExamination, payExamination } from '../api/examinationsApi'
import type { CreateExaminationRequest } from '../types'

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
