import { useMutation, useQueryClient } from '@tanstack/react-query'
import { patientKeys } from '../api/patientKeys'
import { createPatient, deletePatient, updatePatient } from '../api/patientsApi'
import type { PatientWriteRequest } from '../types'

function useInvalidatePatients() {
  const queryClient = useQueryClient()

  return () => queryClient.invalidateQueries({ queryKey: patientKeys.all })
}

export function useCreatePatient() {
  const invalidate = useInvalidatePatients()

  return useMutation({
    mutationFn: (request: PatientWriteRequest) => createPatient(request),
    onSuccess: invalidate,
  })
}

export function useUpdatePatient() {
  const invalidate = useInvalidatePatients()

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: PatientWriteRequest }) =>
      updatePatient(id, request),
    onSuccess: invalidate,
  })
}

export function useDeletePatient() {
  const invalidate = useInvalidatePatients()

  return useMutation({
    mutationFn: (id: string) => deletePatient(id),
    onSuccess: invalidate,
  })
}
