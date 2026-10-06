import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createRegistration, getLastClinic, getPatientRegistrations } from '../api/microchipsApi'
import { microchipKeys } from '../api/microchipKeys'
import type { RegisterMicrochipRequest } from '../types'

export function usePatientRegistrations(patientId: string) {
  return useQuery({
    queryKey: microchipKeys.patient(patientId),
    queryFn: () => getPatientRegistrations(patientId),
    meta: { errorTitle: 'Could not load the microchip registration' },
  })
}

export function useLastClinic(enabled: boolean) {
  return useQuery({
    queryKey: microchipKeys.lastClinic(),
    queryFn: getLastClinic,
    enabled,
  })
}

export function useRegisterMicrochip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      patientId,
      request,
    }: {
      patientId: string
      request: RegisterMicrochipRequest
    }) => createRegistration(patientId, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: microchipKeys.all }),
  })
}
