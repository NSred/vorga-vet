import { useQuery } from '@tanstack/react-query'
import type { DateRange } from '@/shared/lib/clinicTime'
import { appointmentKeys } from '../api/appointmentKeys'
import { getAvailability } from '../api/appointmentsApi'

export interface AvailabilityQueryOptions {
  durationMinutes?: number
  enabled?: boolean
}

export function useAvailabilityQuery(range: DateRange, options: AvailabilityQueryOptions = {}) {
  const { durationMinutes, enabled = true } = options

  return useQuery({
    queryKey: appointmentKeys.availability(range, durationMinutes),
    queryFn: () => getAvailability(range, durationMinutes),
    enabled,
    meta: { errorTitle: 'Could not load opening hours' },
  })
}
