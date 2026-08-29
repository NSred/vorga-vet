import { useMemo } from 'react'
import { useAppointmentsQuery } from '@/features/appointments'
import {
  countByHour,
  dayBreakdown,
  hourHistogram,
  peakOf,
  type DayBreakdown,
  type HourCount,
} from '../lib/appointmentStats'

export interface PeakHoursBreakdown {
  peakHour: HourCount | null
  busiestDay: DayBreakdown | null
  averagePerDay: number
  totalAppointments: number
  byHour: HourCount[]
  byDay: DayBreakdown[]
}

export function usePeakHoursBreakdown(enabled: boolean): PeakHoursBreakdown | null {
  const { data } = useAppointmentsQuery(enabled)

  return useMemo(() => {
    if (!data) return null

    const byDay = dayBreakdown(data)
    const busiestDay = byDay.reduce<DayBreakdown | null>(
      (best, day) => (day.total > 0 && (!best || day.total > best.total) ? day : best),
      null,
    )

    return {
      peakHour: peakOf(countByHour(data)),
      busiestDay,
      averagePerDay: Math.round((data.length / 7) * 10) / 10,
      totalAppointments: data.length,
      byHour: hourHistogram(data),
      byDay,
    }
  }, [data])
}
