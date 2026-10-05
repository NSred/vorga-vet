import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createManualVaccination,
  createReminder,
  deleteVaccination,
  markReminderDone,
  markVaccinationContacted,
  saveExamVaccinations,
} from '../api/vaccinationsApi'
import { vaccinationKeys } from '../api/vaccinationKeys'
import type { ExamVaccinationsRequest, ManualVaccinationRequest, ReminderRequest } from '../types'

function useInvalidateVaccinations() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: vaccinationKeys.all })
}

export function useAddVaccination() {
  const invalidate = useInvalidateVaccinations()
  return useMutation({
    mutationFn: ({
      patientId,
      request,
    }: {
      patientId: string
      request: ManualVaccinationRequest
    }) => createManualVaccination(patientId, request),
    onSuccess: invalidate,
  })
}

export function useRemoveVaccination() {
  const invalidate = useInvalidateVaccinations()
  return useMutation({ mutationFn: (id: string) => deleteVaccination(id), onSuccess: invalidate })
}

export function useSaveExamVaccinations() {
  const invalidate = useInvalidateVaccinations()
  return useMutation({
    mutationFn: ({
      examinationId,
      request,
    }: {
      examinationId: string
      request: ExamVaccinationsRequest
    }) => saveExamVaccinations(examinationId, request),
    onSuccess: invalidate,
  })
}

export function useMarkContacted() {
  const invalidate = useInvalidateVaccinations()
  return useMutation({
    mutationFn: (id: string) => markVaccinationContacted(id),
    onSuccess: invalidate,
  })
}

export function useAddReminder() {
  const invalidate = useInvalidateVaccinations()
  return useMutation({
    mutationFn: ({ patientId, request }: { patientId: string; request: ReminderRequest }) =>
      createReminder(patientId, request),
    onSuccess: invalidate,
  })
}

export function useCompleteReminder() {
  const invalidate = useInvalidateVaccinations()
  return useMutation({ mutationFn: (id: string) => markReminderDone(id), onSuccess: invalidate })
}
