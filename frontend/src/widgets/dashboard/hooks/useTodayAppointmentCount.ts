import { useMemo } from 'react'
import { useAppointmentsQuery } from '@/features/appointments'
import { clinicDayRange, clinicToday } from '@/shared/lib/clinicTime'
import { countedAppointments } from '../lib/appointmentStats'

export function useTodayAppointmentCount(): { count: number; isPending: boolean } {
  const range = clinicDayRange(clinicToday())
  const { data, isPending } = useAppointmentsQuery(range)

  const count = useMemo(() => (data ? countedAppointments(data).length : 0), [data])

  return { count, isPending }
}
