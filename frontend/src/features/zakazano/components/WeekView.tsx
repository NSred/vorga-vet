import { addDays, startOfWeek } from 'date-fns'
import type { Patient } from '@/features/kartoteka'
import { formatDateOnly, todayIso } from '@/shared/lib/dateOnly'
import { AppointmentChip } from './AppointmentChip'
import type { Appointment } from '../types'
import styles from './WeekView.module.css'

export interface WeekViewProps {
  date: Date
  appointments: Appointment[]
  patients: Map<string, Patient>
  onAppointmentClick: (appointment: Appointment) => void
  onDateSelect: (date: Date) => void
}

const WEEKDAY_HEADERS = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned']
const VISIBLE_CHIP_LIMIT = 3

export function WeekView({ date, appointments, patients, onAppointmentClick, onDateSelect }: WeekViewProps) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
  const today = todayIso()

  return (
    <div className={styles.week}>
      {days.map((day, index) => {
        const dayIso = formatDateOnly(day)
        const dayAppointments = appointments
          .filter((appointment) => appointment.date === dayIso)
          .sort((a, b) => a.time.localeCompare(b.time))
        const visible = dayAppointments.slice(0, VISIBLE_CHIP_LIMIT)
        const overflowCount = dayAppointments.length - visible.length

        return (
          <div key={dayIso} className={`${styles.dayCell} ${dayIso === today ? styles.today : ''}`}>
            <div className={styles.dayHeader}>
              <span>{WEEKDAY_HEADERS[index]}</span>
              <span className={styles.dayNumber}>{day.getDate()}</span>
              {dayAppointments.length > 0 && <span className={styles.countBadge}>{dayAppointments.length}</span>}
            </div>
            <div className={styles.chips}>
              {visible.map((appointment) => (
                <AppointmentChip
                  key={appointment.id}
                  appointment={appointment}
                  patient={patients.get(appointment.patientId)}
                  onClick={() => onAppointmentClick(appointment)}
                />
              ))}
              {overflowCount > 0 && (
                <button type="button" className={styles.overflow} onClick={() => onDateSelect(day)}>
                  +{overflowCount} još
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
