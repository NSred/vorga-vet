import { Fragment } from 'react'
import { EmptyState, Skeleton } from '@/shared/ui'
import { AppointmentBlock } from './AppointmentBlock'
import { AppointmentChip } from './AppointmentChip'
import { appointmentsOutsideSlots, layoutDay } from '../lib/daySlots'
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

  const { rows, blocks, laneCount } = layoutDay(appointments, slots)
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
          <div className={styles.outsideChips}>
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

      {rows.length > 0 && (
        <div
          className={styles.grid}
          style={{
            gridTemplateColumns: `3.5rem repeat(${laneCount}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows.length}, var(--day-slot-height))`,
          }}
        >
          {rows.map((row, index) => {
            const place = { gridRow: index + 1 }
            return (
              <Fragment key={row.startsAt}>
                <span
                  className={row.isBusy ? styles.labelBusy : styles.label}
                  style={{ ...place, gridColumn: 1 }}
                >
                  {row.label}
                </span>
                {row.isFree && onSlotClick ? (
                  <button
                    type="button"
                    className={styles.freeCell}
                    style={{ ...place, gridColumn: '2 / -1' }}
                    onClick={() => onSlotClick(row.startsAt)}
                    aria-label={`Book ${row.label}`}
                  >
                    <span className={styles.free}>Free</span>
                  </button>
                ) : (
                  <div className={styles.cell} style={{ ...place, gridColumn: '2 / -1' }}>
                    {row.isFree && <span className={styles.free}>Free</span>}
                  </div>
                )}
              </Fragment>
            )
          })}

          {blocks.map((block) => (
            <AppointmentBlock
              key={block.appointment.id}
              appointment={block.appointment}
              onClick={() => onAppointmentClick(block.appointment)}
              style={{
                gridRow: `${block.row + 1} / span ${block.span}`,
                gridColumn: block.lane + 2,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
