import type { ReactNode } from 'react'
import type { Appointment } from '../types'
import { AgendaRow } from './AgendaRow'
import styles from './AgendaDay.module.css'

export interface AgendaDayProps {
  label: string
  isToday: boolean
  appointments: Appointment[]
  emptyText: string
  onAppointmentClick: (appointment: Appointment) => void
  action?: ReactNode
}

export function AgendaDay({
  label,
  isToday,
  appointments,
  emptyText,
  onAppointmentClick,
  action,
}: AgendaDayProps) {
  return (
    <section className={styles.day} aria-label={label}>
      <div className={styles.heading}>
        <span className={`${styles.label} ${isToday ? styles.labelToday : ''}`}>{label}</span>
        {isToday && <span className={styles.todayTag}>Today</span>}
        <span className={styles.rule} />
        {appointments.length > 0 && <span className={styles.count}>{appointments.length}</span>}
      </div>
      {appointments.length === 0 ? (
        <p className={styles.empty}>{emptyText}</p>
      ) : (
        <div className={styles.rows}>
          {appointments.map((appointment) => (
            <AgendaRow
              key={appointment.id}
              appointment={appointment}
              onClick={() => onAppointmentClick(appointment)}
            />
          ))}
        </div>
      )}
      {action}
    </section>
  )
}
