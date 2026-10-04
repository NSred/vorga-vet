import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  appointmentKeys,
  checkInAppointment,
  completeAppointment,
  type CheckInRequest,
  type CompleteAppointmentRequest,
} from '@/features/appointments'
import { examinationKeys } from '@/features/examinations'
import { patientKeys } from '@/features/patients'

function useInvalidateVisit() {
  const queryClient = useQueryClient()

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all }),
      queryClient.invalidateQueries({ queryKey: patientKeys.all }),
      queryClient.invalidateQueries({ queryKey: examinationKeys.all }),
    ])
}

export function useCheckInAppointment() {
  const invalidate = useInvalidateVisit()

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: CheckInRequest }) =>
      checkInAppointment(id, request),
    onSuccess: invalidate,
  })
}

export function useCompleteAppointment() {
  const invalidate = useInvalidateVisit()

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: CompleteAppointmentRequest }) =>
      completeAppointment(id, request),
    onSuccess: invalidate,
  })
}
