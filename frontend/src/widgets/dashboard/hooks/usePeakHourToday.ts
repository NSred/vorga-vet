import { useMemo } from 'react'
import { useAppointmentsQuery } from '@/features/appointments'
import { clinicDayRange, clinicToday } from '@/shared/lib/clinicTime'
import { countByHour, countedAppointments, peakOf, type HourCount } from '../lib/appointmentStats'

export function usePeakHourToday(): { peakHour: HourCount | null; isPending: boolean } {
  const range = clinicDayRange(clinicToday())
  const { data, isPending } = useAppointmentsQuery(range)

  const peakHour = useMemo(
    () => (data ? peakOf(countByHour(countedAppointments(data))) : null),
    [data],
  )

  return { peakHour, isPending }
}
