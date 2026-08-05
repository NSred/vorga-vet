import { SPECIES_EMOJI, type Patient } from '@/features/kartoteka'
import type { Appointment } from '../types'
import styles from './AppointmentChip.module.css'

export interface AppointmentChipProps {
  appointment: Appointment
  patient: Patient | undefined
  onClick: () => void
}

export function AppointmentChip({ appointment, patient, onClick }: AppointmentChipProps) {
  const label = patient
    ? `${SPECIES_EMOJI[patient.species]} ${patient.name} · ${patient.ownerName}`
    : 'Nepoznat pacijent'

  const title = `${appointment.time} · ${appointment.type} · ${label}${
    appointment.note ? ` — ${appointment.note}` : ''
  }`

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`${styles.chip} ${appointment.reminderEnabled ? styles.reminder : ''}`}
    >
      {appointment.time} {label}
      {appointment.reminderEnabled && ' 🔔'}
    </button>
  )
}
