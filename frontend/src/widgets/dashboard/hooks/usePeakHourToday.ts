import { useMemo } from 'react'
import { useAppointmentsQuery } from '@/features/appointments'
import { todayIso } from '@/shared/lib/dateOnly'
import { appointmentsOn, countByHour, peakOf, type HourCount } from '../lib/appointmentStats'

export function usePeakHourToday(): { peakHour: HourCount | null; isPending: boolean } {
  const { data, isPending } = useAppointmentsQuery()

  const peakHour = useMemo(
    () => (data ? peakOf(countByHour(appointmentsOn(data, todayIso()))) : null),
    [data],
  )

  return { peakHour, isPending }
}
