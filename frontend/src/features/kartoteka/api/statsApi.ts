import { simulateLatency } from '@/shared/lib/simulateLatency'
import { todayIso } from '@/shared/lib/dateOnly'
import { getAppointments } from '@/features/zakazano'
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
