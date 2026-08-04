import { simulateLatency } from '@/shared/lib/simulateLatency'
import { patients } from './mockData'

export interface DashboardStats {
  totalPatients: number
  allergyCount: number
  peakHour: { hour: string; count: number } | null
  todayAppointmentsCount: number
}

// Standalone placeholder numbers — NOT a real Appointment model. Replaced
// once the Zakazano tab models real appointments (see spec Risks section).
const HOURLY_APPOINTMENT_COUNTS: Record<string, number> = {
  '07:00': 0,
  '08:00': 2,
  '09:00': 1,
  '10:00': 1,
  '11:00': 0,
  '12:00': 1,
  '13:00': 0,
  '14:00': 1,
  '15:00': 0,
  '16:00': 1,
  '17:00': 0,
  '18:00': 0,
  '19:00': 0,
  '20:00': 0,
}

export function getDashboardStats(): Promise<DashboardStats> {
  const active = patients.filter((patient) => patient.cardStatus === 'aktivan')
  const [peakHourEntry] = Object.entries(HOURLY_APPOINTMENT_COUNTS).sort((a, b) => b[1] - a[1])

  const stats: DashboardStats = {
    totalPatients: active.length,
    allergyCount: active.filter((patient) => patient.allergies !== 'nema').length,
    peakHour: peakHourEntry && peakHourEntry[1] > 0 ? { hour: peakHourEntry[0], count: peakHourEntry[1] } : null,
    todayAppointmentsCount: 5,
  }

  return simulateLatency(stats)
}
