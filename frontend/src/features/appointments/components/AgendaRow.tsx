import { Badge, type BadgeTone } from '@/shared/ui'
import { clinicTimeOf } from '@/shared/lib/clinicTime'
import { statusLabel, typeLabel, typeTone } from '../lib/appointmentLabels'
import { durationLabel } from '../lib/daySlots'
import type { Appointment } from '../types'
import styles from './AgendaRow.module.css'

const TONE_COLORS: Partial<Record<BadgeTone, string>> = {
  male: 'var(--male)',
  ok: 'var(--accent)',
  female: 'var(--female)',
  warn: 'var(--warn)',
}

export interface AgendaRowProps {
  appointment: Appointment
  onClick: () => void
}

export function AgendaRow({ appointment, onClick }: AgendaRowProps) {
  const tone = typeTone(appointment.type)
  const inactive = appointment.status === 'cancelled' || appointment.status === 'no_show'

  return (
    <button
      type="button"
      className={`${styles.row} ${inactive ? styles.inactive : ''}`}
      style={{ borderLeftColor: TONE_COLORS[tone] }}
      onClick={onClick}
    >
      <span className={styles.time}>
        <span className={styles.start}>{clinicTimeOf(appointment.startsAt)}</span>
        <span className={styles.duration}>{durationLabel(appointment.durationMinutes)}</span>
      </span>
      <span className={styles.who}>
        <span className={styles.patient}>{appointment.patientName ?? 'No patient yet'}</span>
        <span className={styles.owner}>
          {inactive ? statusLabel(appointment.status) : (appointment.ownerName ?? 'Client booking')}
        </span>
      </span>
      <Badge tone={tone}>{typeLabel(appointment.type)}</Badge>
    </button>
  )
}
