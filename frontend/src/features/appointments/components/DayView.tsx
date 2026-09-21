import { EmptyState, Skeleton } from '@/shared/ui'
import { AppointmentChip } from './AppointmentChip'
import { appointmentsOutsideSlots, buildDayRows } from '../lib/daySlots'
import type { Appointment, AvailabilitySlot } from '../types'
import styles from './DayView.module.css'

export interface DayViewProps {
  date: string
  slots: AvailabilitySlot[]
  appointments: Appointment[]
  onAppointmentClick: (appointment: Appointment) => void
  onSlotClick?: (startsAt: string) => void
  isLoading?: boolean
  hasSlotData: boolean
}

export function DayView({
  slots,
  appointments,
  onAppointmentClick,
  onSlotClick,
  isLoading,
  hasSlotData,
}: DayViewProps) {
  if (isLoading) {
    return <Skeleton height="20rem" />
  }

  const rows = buildDayRows(appointments, slots)
  const outside = appointmentsOutsideSlots(appointments, slots)

  if (hasSlotData && slots.length === 0 && outside.length === 0) {
    return <EmptyState message="The clinic is closed on this day." />
  }

  return (
    <div className={styles.day}>
      {outside.length > 0 && (
        <div className={styles.outside}>
          <span className={styles.outsideLabel}>
            {hasSlotData ? 'Outside opening hours' : 'Opening hours unavailable'}
          </span>
          <div className={styles.slotChips}>
            {outside.map((appointment) => (
              <AppointmentChip
                key={appointment.id}
                appointment={appointment}
                onClick={() => onAppointmentClick(appointment)}
              />
            ))}
          </div>
        </div>
      )}

      {rows.map((row) => (
        <div key={row.startsAt} className={styles.slotRow}>
          <span className={styles.slotLabel}>{row.label}</span>
          <div className={styles.slotChips}>
            {row.starting.map((appointment) => (
              <AppointmentChip
                key={appointment.id}
                appointment={appointment}
                onClick={() => onAppointmentClick(appointment)}
              />
            ))}
            {row.continuing.length > 0 && <span className={styles.continues}>↳ continues</span>}
            {row.isFree &&
              (onSlotClick ? (
                <button
                  type="button"
                  className={styles.freeButton}
                  onClick={() => onSlotClick(row.startsAt)}
                  aria-label={`Book ${row.label}`}
                >
                  Free
                </button>
              ) : (
                <span className={styles.free}>Free</span>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
