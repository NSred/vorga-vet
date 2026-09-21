import { useQuery } from '@tanstack/react-query'
import type { DateRange } from '@/shared/lib/clinicTime'
import { appointmentKeys } from '../api/appointmentKeys'
import { getAvailability } from '../api/appointmentsApi'

export function useAvailabilityQuery(range: DateRange, enabled = true) {
  return useQuery({
    queryKey: appointmentKeys.availability(range),
    queryFn: () => getAvailability(range),
    enabled,
  })
}
