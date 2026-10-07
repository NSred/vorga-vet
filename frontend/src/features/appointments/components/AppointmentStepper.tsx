import { Badge } from '@/shared/ui'
import { statusLabel } from '../lib/appointmentLabels'
import type { Appointment, AppointmentStatus } from '../types'
import styles from './AppointmentStepper.module.css'

const STEPS: AppointmentStatus[] = ['scheduled', 'checked_in', 'completed']

export interface AppointmentStepperProps {
  appointment: Appointment
}

export function AppointmentStepper({ appointment }: AppointmentStepperProps) {
  const current = STEPS.indexOf(appointment.status)

  if (current === -1) {
    return (
      <div className={styles.left}>
        <Badge tone="danger">{statusLabel(appointment.status)}</Badge>
        <span className={styles.leftNote}>This visit left the schedule.</span>
      </div>
    )
  }

  return (
    <ol className={styles.stepper} aria-label="Visit progress">
      {STEPS.map((step, index) => {
        const done = index < current || appointment.status === 'completed'
        const active = index === current
        return (
          <li
            key={step}
            className={[styles.step, done && styles.done, active && styles.active]
              .filter(Boolean)
              .join(' ')}
            aria-current={active ? 'step' : undefined}
          >
            <span className={styles.mark} aria-hidden="true">
              {done ? '✓' : index + 1}
            </span>
            <span className={styles.label}>{statusLabel(step)}</span>
          </li>
        )
      })}
    </ol>
  )
}
