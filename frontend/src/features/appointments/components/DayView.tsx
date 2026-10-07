import { Fragment, useEffect, useState } from 'react'
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

const MINUTE = 60_000

function useNow(): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), MINUTE)
    return () => window.clearInterval(timer)
  }, [])

  return now
}

function nowPosition(slots: AvailabilitySlot[], now: number) {
  const index = slots.findIndex(
    (slot) => Date.parse(slot.startsAt) <= now && now < Date.parse(slot.endsAt),
  )
  if (index === -1) return null
  const start = Date.parse(slots[index].startsAt)
  const fraction = (now - start) / (Date.parse(slots[index].endsAt) - start)
  return { index, fraction }
}

export function DayView({
  slots,
  appointments,
  onAppointmentClick,
  onSlotClick,
  isLoading,
  hasSlotData,
}: DayViewProps) {
  const now = useNow()

  if (isLoading) {
    return <Skeleton height="20rem" />
  }

  const { rows, blocks, laneCount } = layoutDay(appointments, slots)
  const outside = appointmentsOutsideSlots(appointments, slots)
  const nowAt = nowPosition(slots, now)

  if (hasSlotData && slots.length === 0 && outside.length === 0) {
    return (
      <EmptyState
        message="The clinic is closed on this day."
        icon="🌙"
        hint="Pick another day to book."
      />
    )
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

          {nowAt && (
            <span
              className={styles.now}
              data-testid="now-line"
              aria-hidden="true"
              style={{
                gridRow: nowAt.index + 1,
                gridColumn: '1 / -1',
                marginTop: `calc(${nowAt.fraction} * var(--day-slot-height))`,
              }}
            />
          )}

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
