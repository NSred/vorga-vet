import { useQuery } from '@tanstack/react-query'
import { appointmentKeys } from '../api/appointmentKeys'
import { getUnresolvedAppointments } from '../api/appointmentsApi'

export function useUnresolvedAppointmentsQuery(enabled = true) {
  return useQuery({
    queryKey: appointmentKeys.unresolved(),
    queryFn: getUnresolvedAppointments,
    enabled,
    meta: { errorTitle: 'Could not load unresolved appointments' },
  })
}
