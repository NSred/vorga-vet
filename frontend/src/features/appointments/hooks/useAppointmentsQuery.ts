import { useQuery } from '@tanstack/react-query'
import { appointmentKeys } from '../api/appointmentKeys'
import { getAppointments } from '../api/appointmentsApi'

export function useAppointmentsQuery(enabled = true) {
  return useQuery({
    queryKey: appointmentKeys.list(),
    queryFn: getAppointments,
    enabled,
  })
}
