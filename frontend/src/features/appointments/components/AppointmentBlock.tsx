import type { CSSProperties } from 'react'
import { appointmentTimeLabel, statusLabel, typeLabel } from '../lib/appointmentLabels'
import { durationLabel } from '../lib/daySlots'
import type { Appointment } from '../types'
import styles from './AppointmentBlock.module.css'

export interface AppointmentBlockProps {
  appointment: Appointment
  onClick: () => void
  style?: CSSProperties
  showDuration?: boolean
}

export function AppointmentBlock({
  appointment,
  onClick,
  style,
  showDuration = true,
}: AppointmentBlockProps) {
  const title = [typeLabel(appointment.type), statusLabel(appointment.status), appointment.reason]
    .filter(Boolean)
    .join(' · ')

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={style}
      className={`${styles.block} ${styles[appointment.status]}`}
    >
      <span className={styles.line}>
        <span className={styles.time}>{appointmentTimeLabel(appointment)}</span>
        <span className={styles.patient}>{appointment.patientName ?? 'No patient yet'}</span>
        {appointment.ownerName && <span className={styles.owner}>{appointment.ownerName}</span>}
      </span>
      {showDuration && (
        <span className={styles.duration}>{durationLabel(appointment.durationMinutes)}</span>
      )}
    </button>
  )
}
