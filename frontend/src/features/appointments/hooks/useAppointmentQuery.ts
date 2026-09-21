import { useQuery } from '@tanstack/react-query'
import { appointmentKeys } from '../api/appointmentKeys'
import { getAppointment } from '../api/appointmentsApi'

export function useAppointmentQuery(id: string | null, enabled = true) {
  return useQuery({
    queryKey: appointmentKeys.detail(id ?? ''),
    queryFn: () => getAppointment(id ?? ''),
    enabled: enabled && id !== null,
    meta: { errorTitle: 'Could not load the appointment' },
  })
}
