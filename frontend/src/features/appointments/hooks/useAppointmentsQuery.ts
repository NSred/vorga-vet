import { useQuery } from '@tanstack/react-query'
import type { DateRange } from '@/shared/lib/clinicTime'
import { appointmentKeys } from '../api/appointmentKeys'
import { getAppointments } from '../api/appointmentsApi'

export function useAppointmentsQuery(range: DateRange, enabled = true) {
  return useQuery({
    queryKey: appointmentKeys.list(range),
    queryFn: () => getAppointments(range),
    enabled,
    meta: { errorTitle: 'Could not load appointments' },
  })
}
