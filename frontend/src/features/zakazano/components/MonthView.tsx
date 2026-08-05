import { eachDayOfInterval, endOfMonth, getDay, startOfMonth } from 'date-fns'
import type { Patient } from '@/features/kartoteka'
import { formatDateOnly, todayIso } from '@/shared/lib/dateOnly'
import { AppointmentChip } from './AppointmentChip'
import type { Appointment } from '../types'
import styles from './MonthView.module.css'

export interface MonthViewProps {
  date: Date
  appointments: Appointment[]
  patients: Map<string, Patient>
  onAppointmentClick: (appointment: Appointment) => void
  onDateSelect: (date: Date) => void
}

const WEEKDAY_HEADERS = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned']
const VISIBLE_CHIP_LIMIT = 3

export function MonthView({ date, appointments, patients, onAppointmentClick, onDateSelect }: MonthViewProps) {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  // getDay(): Sun=0..Sat=6. Convert to a Mon=0..Sun=6 leading-blank count.
  const leadingBlanks = (getDay(monthStart) + 6) % 7
  const today = todayIso()

  return (
    <div className={styles.month}>
      {WEEKDAY_HEADERS.map((label) => (
        <div key={label} className={styles.weekdayHeader}>
          {label}
        </div>
      ))}

      {Array.from({ length: leadingBlanks }, (_, index) => (
        <div key={`blank-${index}`} className={styles.blankCell} />
      ))}

      {days.map((day) => {
        const dayIso = formatDateOnly(day)
        const dayAppointments = appointments
          .filter((appointment) => appointment.date === dayIso)
          .sort((a, b) => a.time.localeCompare(b.time))
        const visible = dayAppointments.slice(0, VISIBLE_CHIP_LIMIT)
        const overflowCount = dayAppointments.length - visible.length

        return (
          <div key={dayIso} className={`${styles.dayCell} ${dayIso === today ? styles.today : ''}`}>
            <span className={styles.dayNumber}>{day.getDate()}</span>
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
