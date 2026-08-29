import { SPECIES_EMOJI } from '@/shared/domain/species'
import type { MockPatient } from '../api/mockPatients'
import type { Appointment } from '../types'
import styles from './AppointmentChip.module.css'

export interface AppointmentChipProps {
  appointment: Appointment
  patient: MockPatient | undefined
  onClick: () => void
}

export function AppointmentChip({ appointment, patient, onClick }: AppointmentChipProps) {
  const label = patient
    ? `${SPECIES_EMOJI[patient.species]} ${patient.name} · ${patient.ownerName}`
    : 'Unknown patient'

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
