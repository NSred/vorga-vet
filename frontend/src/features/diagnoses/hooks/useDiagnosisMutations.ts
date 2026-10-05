import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  addDiagnosis,
  editDiagnosis,
  importDiagnosisNames,
  restoreDiagnosis,
  retireDiagnosis,
} from '../api/diagnosesApi'
import { diagnosisKeys } from '../api/diagnosisKeys'
import type { DiagnosisWriteRequest } from '../types'

function useInvalidateDiagnoses() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: diagnosisKeys.all })
}

export function useCreateDiagnosis() {
  const invalidate = useInvalidateDiagnoses()
  return useMutation({
    mutationFn: (request: DiagnosisWriteRequest) => addDiagnosis(request),
    onSuccess: invalidate,
  })
}

export function useUpdateDiagnosis() {
  const invalidate = useInvalidateDiagnoses()
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: DiagnosisWriteRequest }) =>
      editDiagnosis(id, request),
    onSuccess: invalidate,
  })
}

export function useRetireDiagnosis() {
  const invalidate = useInvalidateDiagnoses()
  return useMutation({ mutationFn: (id: string) => retireDiagnosis(id), onSuccess: invalidate })
}

export function useRestoreDiagnosis() {
  const invalidate = useInvalidateDiagnoses()
  return useMutation({ mutationFn: (id: string) => restoreDiagnosis(id), onSuccess: invalidate })
}

export function useImportDiagnoses() {
  const invalidate = useInvalidateDiagnoses()
  return useMutation({
    mutationFn: (names: string[]) => importDiagnosisNames(names),
    onSuccess: invalidate,
  })
}
