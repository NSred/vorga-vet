import type { Patient } from '@/features/patients'
import { Skeleton } from '@/shared/ui'
import { formatDateOnly } from '@/shared/lib/dateOnly'
import { AppointmentChip } from './AppointmentChip'
import type { Appointment } from '../types'
import styles from './DayView.module.css'

export interface DayViewProps {
  date: Date
  appointments: Appointment[]
  patients: Map<string, Patient>
  onAppointmentClick: (appointment: Appointment) => void
  isLoading?: boolean
}

const HOURS = Array.from({ length: 14 }, (_, index) => `${String(index + 7).padStart(2, '0')}:00`)

function hourBucket(time: string): string {
  return `${time.split(':')[0].padStart(2, '0')}:00`
}

export function DayView({ date, appointments, patients, onAppointmentClick, isLoading }: DayViewProps) {
  const dateIso = formatDateOnly(date)
  const dayAppointments = appointments.filter((appointment) => appointment.date === dateIso)

  return (
    <div className={styles.day}>
      {HOURS.map((hour) => {
        const hourAppointments = dayAppointments.filter((appointment) => hourBucket(appointment.time) === hour)
        return (
          <div key={hour} className={styles.hourRow}>
            <span className={styles.hourLabel}>{hour}</span>
            <div className={styles.hourSlots}>
              {isLoading ? (
                <Skeleton height="1.25rem" />
              ) : (
                hourAppointments.map((appointment) => (
                  <AppointmentChip
                    key={appointment.id}
                    appointment={appointment}
                    patient={patients.get(appointment.patientId)}
                    onClick={() => onAppointmentClick(appointment)}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
