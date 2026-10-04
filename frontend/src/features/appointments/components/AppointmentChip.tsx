import { appointmentTimeLabel, partyLabel, statusLabel, typeLabel } from '../lib/appointmentLabels'
import type { Appointment } from '../types'
import styles from './AppointmentChip.module.css'

export interface AppointmentChipProps {
  appointment: Appointment
  onClick: () => void
}

export function AppointmentChip({ appointment, onClick }: AppointmentChipProps) {
  const title = [typeLabel(appointment.type), statusLabel(appointment.status), appointment.reason]
    .filter(Boolean)
    .join(' · ')

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`${styles.chip} ${styles[appointment.status]}`}
    >
      {appointmentTimeLabel(appointment)} {partyLabel(appointment)}
    </button>
  )
}
