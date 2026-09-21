import { useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentKeys } from '../api/appointmentKeys'
import {
  cancelAppointment,
  createAppointment,
  markNoShow,
  rescheduleAppointment,
} from '../api/appointmentsApi'
import type { CreateAppointmentRequest, RescheduleAppointmentRequest } from '../types'

function useInvalidateAppointments() {
  const queryClient = useQueryClient()

  return () => queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
}

export function useCreateAppointment() {
  const invalidate = useInvalidateAppointments()

  return useMutation({
    mutationFn: (request: CreateAppointmentRequest) => createAppointment(request),
    onSuccess: invalidate,
  })
}

export function useRescheduleAppointment() {
  const invalidate = useInvalidateAppointments()

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: RescheduleAppointmentRequest }) =>
      rescheduleAppointment(id, request),
    onSuccess: invalidate,
  })
}

export function useCancelAppointment() {
  const invalidate = useInvalidateAppointments()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => cancelAppointment(id, reason),
    onSuccess: invalidate,
  })
}

export function useMarkNoShow() {
  const invalidate = useInvalidateAppointments()

  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => markNoShow(id, note),
    onSuccess: invalidate,
  })
}
