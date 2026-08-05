import { simulateLatency } from '@/shared/lib/simulateLatency'
import { parseDateOnly, todayIso } from '@/shared/lib/dateOnly'
import { getAppointments, WEEKDAYS } from '@/features/zakazano'
import { patients } from './mockData'

export interface DashboardStats {
  totalPatients: number
  allergyCount: number
  peakHour: { hour: string; count: number } | null
  todayAppointmentsCount: number
}

function getHourBucket(time: string): string {
  return `${time.split(':')[0].padStart(2, '0')}:00`
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const active = patients.filter((patient) => patient.cardStatus === 'aktivan')
  const appointments = await getAppointments()
  const today = todayIso()
  const todaysAppointments = appointments.filter((appointment) => appointment.date === today)

  const hourCounts = new Map<string, number>()
  for (const appointment of todaysAppointments) {
    const hour = getHourBucket(appointment.time)
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1)
  }

  let peakHour: DashboardStats['peakHour'] = null
  for (const [hour, count] of hourCounts) {
    if (!peakHour || count > peakHour.count) {
      peakHour = { hour, count }
    }
  }

  const stats: DashboardStats = {
    totalPatients: active.length,
    allergyCount: active.filter((patient) => patient.allergies !== 'nema').length,
    peakHour,
    todayAppointmentsCount: todaysAppointments.length,
  }

  return simulateLatency(stats)
}

const PEAK_HOURS_RANGE = Array.from({ length: 14 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`)
const MONDAY_FIRST_ORDER = [1, 2, 3, 4, 5, 6, 0]

export interface HourBreakdown {
  hour: string
  count: number
}

export interface DayBreakdown {
  day: string
  total: number
  peakHour: { hour: string; count: number } | null
}

export interface PeakHoursBreakdown {
  peakHour: { hour: string; count: number } | null
  busiestDay: DayBreakdown | null
  averagePerDay: number
  totalAppointments: number
  byHour: HourBreakdown[]
  byDay: DayBreakdown[]
}

function peakOf(counts: Map<string, number>): { hour: string; count: number } | null {
  let peak: { hour: string; count: number } | null = null
  for (const [hour, count] of counts) {
    if (!peak || count > peak.count) {
      peak = { hour, count }
    }
  }
  return peak
}

export async function getPeakHoursBreakdown(): Promise<PeakHoursBreakdown> {
  const appointments = await getAppointments()

  const hourCounts = new Map<string, number>()
  for (const appointment of appointments) {
    const hour = getHourBucket(appointment.time)
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1)
  }

  const byHour: HourBreakdown[] = PEAK_HOURS_RANGE.map((hour) => ({
    hour,
    count: hourCounts.get(hour) ?? 0,
  }))

  const byDay: DayBreakdown[] = MONDAY_FIRST_ORDER.map((weekdayIndex) => {
    const dayAppointments = appointments.filter(
      (appointment) => parseDateOnly(appointment.date).getDay() === weekdayIndex,
    )
    const dayHourCounts = new Map<string, number>()
    for (const appointment of dayAppointments) {
      const hour = getHourBucket(appointment.time)
      dayHourCounts.set(hour, (dayHourCounts.get(hour) ?? 0) + 1)
    }
    return {
      day: WEEKDAYS[weekdayIndex],
      total: dayAppointments.length,
      peakHour: peakOf(dayHourCounts),
    }
  })

  const busiestDay = byDay.reduce<DayBreakdown | null>(
    (best, day) => (day.total > 0 && (!best || day.total > best.total) ? day : best),
    null,
  )

  const stats: PeakHoursBreakdown = {
    peakHour: peakOf(hourCounts),
    busiestDay,
    averagePerDay: Math.round((appointments.length / 7) * 10) / 10,
    totalAppointments: appointments.length,
    byHour,
    byDay,
  }

  return simulateLatency(stats)
}
