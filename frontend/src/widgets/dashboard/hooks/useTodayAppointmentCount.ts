import { useMemo } from 'react'
import { useAppointmentsQuery } from '@/features/appointments'
import { todayIso } from '@/shared/lib/dateOnly'
import { appointmentsOn } from '../lib/appointmentStats'

export function useTodayAppointmentCount(): { count: number; isPending: boolean } {
  const { data, isPending } = useAppointmentsQuery()

  const count = useMemo(() => (data ? appointmentsOn(data, todayIso()).length : 0), [data])

  return { count, isPending }
}
