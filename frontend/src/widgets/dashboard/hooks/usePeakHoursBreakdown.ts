import { useMemo } from 'react'
import { useAppointmentsQuery } from '@/features/appointments'
import { clinicRecentDaysRange, clinicToday } from '@/shared/lib/clinicTime'
import {
  countByHour,
  countedAppointments,
  dayBreakdown,
  hourHistogram,
  peakOf,
  type DayBreakdown,
  type HourCount,
} from '../lib/appointmentStats'

const BREAKDOWN_DAYS = 28

export interface PeakHoursBreakdown {
  peakHour: HourCount | null
  busiestDay: DayBreakdown | null
  averagePerDay: number
  totalAppointments: number
  byHour: HourCount[]
  byDay: DayBreakdown[]
}

export function usePeakHoursBreakdown(enabled: boolean): PeakHoursBreakdown | null {
  const range = clinicRecentDaysRange(BREAKDOWN_DAYS, clinicToday())
  const { data } = useAppointmentsQuery(range, enabled)

  return useMemo(() => {
    if (!data) return null

    const counted = countedAppointments(data)
    const byDay = dayBreakdown(counted)
    const busiestDay = byDay.reduce<DayBreakdown | null>(
      (best, day) => (day.total > 0 && (!best || day.total > best.total) ? day : best),
      null,
    )

    return {
      peakHour: peakOf(countByHour(counted)),
      busiestDay,
      averagePerDay: Math.round((counted.length / BREAKDOWN_DAYS) * 10) / 10,
      totalAppointments: counted.length,
      byHour: hourHistogram(counted),
      byDay,
    }
  }, [data])
}
