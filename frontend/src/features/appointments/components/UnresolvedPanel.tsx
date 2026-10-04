import { EmptyState, Skeleton, SlidePanel } from '@/shared/ui'
import { clinicDateOf, clinicTimeOf } from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { useUnresolvedAppointmentsQuery } from '../hooks/useUnresolvedAppointmentsQuery'
import { partyLabel, typeLabel } from '../lib/appointmentLabels'
import type { Appointment } from '../types'
import styles from './UnresolvedPanel.module.css'

export interface UnresolvedPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (appointment: Appointment) => void
}

export function UnresolvedPanel({ open, onOpenChange, onSelect }: UnresolvedPanelProps) {
  const { data, isPending } = useUnresolvedAppointmentsQuery(open)

  return (
    <SlidePanel
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel="Appointments that need closing"
      headerTone="plain"
      header={
        <div>
          <div className={styles.title}>Needs closing</div>
          <div className={styles.subtitle}>
            Scheduled appointments whose time has passed. Open one to mark it.
          </div>
        </div>
      }
    >
      {isPending && <Skeleton height="6rem" />}
      {data && data.length === 0 && <EmptyState message="Everything is closed out." />}
      {data && data.length > 0 && (
        <ul className={styles.list}>
          {data.map((appointment) => (
            <li key={appointment.id}>
              <button type="button" className={styles.row} onClick={() => onSelect(appointment)}>
                <span className={styles.when}>
                  {formatDisplayDate(clinicDateOf(appointment.startsAt))} ·{' '}
                  {clinicTimeOf(appointment.startsAt)}
                </span>
                <span className={styles.party}>{partyLabel(appointment)}</span>
                <span className={styles.type}>{typeLabel(appointment.type)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </SlidePanel>
  )
}
