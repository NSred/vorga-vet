import { useEffect, useRef } from 'react'
import { Skeleton } from '@/shared/ui'
import {
  addClinicDays,
  clinicDateOf,
  clinicToday,
  clinicWeekRange,
  MONDAY_FIRST_WEEKDAYS,
} from '@/shared/lib/clinicTime'
import { AppointmentBlock } from './AppointmentBlock'
import { layoutWeek } from '../lib/weekGrid'
import type { Appointment, AvailabilitySlot } from '../types'
import styles from './WeekView.module.css'

export interface WeekViewProps {
  date: string
  appointments: Appointment[]
  slots: AvailabilitySlot[]
  onAppointmentClick: (appointment: Appointment) => void
  onDateSelect: (dateIso: string) => void
  isLoading?: boolean
  hasSlotData: boolean
}

export function WeekView({
  date,
  appointments,
  slots,
  onAppointmentClick,
  onDateSelect,
  isLoading,
  hasSlotData,
}: WeekViewProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const weekStart = clinicDateOf(clinicWeekRange(date).from)
  const today = clinicToday()

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller || scroller.scrollWidth <= scroller.clientWidth) return
    const todayHeader = scroller.querySelector<HTMLElement>('[data-today]')
    const corner = scroller.querySelector<HTMLElement>('[data-corner]')
    if (!todayHeader) return
    const offset =
      todayHeader.getBoundingClientRect().left -
      scroller.getBoundingClientRect().left -
      (corner?.getBoundingClientRect().width ?? 0)
    scroller.scrollLeft += offset
  }, [weekStart, today, isLoading])

  if (isLoading) {
    return <Skeleton height="20rem" />
  }

  const dates = Array.from({ length: 7 }, (_, index) => addClinicDays(weekStart, index))
  const { rows, days } = layoutWeek(dates, appointments, slots, hasSlotData)
  const rowTemplate = `repeat(${rows.length}, var(--week-slot-height))`

  return (
    <div className={styles.scroller} ref={scrollerRef}>
      <div className={styles.week}>
        <div className={styles.corner} data-corner />
        {days.map((day, index) => (
          <button
            key={day.date}
            type="button"
            className={`${styles.dayHeader} ${day.date === today ? styles.todayHeader : ''}`}
            onClick={() => onDateSelect(day.date)}
            data-today={day.date === today ? '' : undefined}
            aria-label={`Open ${MONDAY_FIRST_WEEKDAYS[index]} ${Number(day.date.slice(8))}`}
          >
            <span>{MONDAY_FIRST_WEEKDAYS[index]}</span>
            <span className={styles.dayNumber}>{Number(day.date.slice(8))}</span>
            {day.isClosed && <span className={styles.closed}>Closed</span>}
            {day.blocks.length > 0 && (
              <span className={styles.countBadge}>{day.blocks.length}</span>
            )}
          </button>
        ))}

        <div className={styles.times} style={{ gridTemplateRows: rowTemplate }}>
          {rows.map((row) => (
            <span key={row.minutes} className={row.isBusy ? styles.timeBusy : styles.time}>
              {row.label}
            </span>
          ))}
        </div>

        {days.map((day) => (
          <div
            key={day.date}
            data-testid={`week-day-${day.date}`}
            className={`${styles.dayColumn} ${day.date === today ? styles.todayColumn : ''}`}
            style={{
              gridTemplateRows: rowTemplate,
              gridTemplateColumns: `repeat(${day.laneCount}, minmax(0, 1fr))`,
            }}
          >
            {rows.map((row, index) => (
              <div
                key={row.minutes}
                className={day.openRows.has(index) ? styles.cell : styles.cellClosed}
                style={{ gridRow: index + 1, gridColumn: '1 / -1' }}
              />
            ))}
            {day.blocks.map((block) => (
              <AppointmentBlock
                key={block.appointment.id}
                appointment={block.appointment}
                onClick={() => onAppointmentClick(block.appointment)}
                showDuration={false}
                style={{
                  gridRow: `${block.row + 1} / span ${block.span}`,
                  gridColumn: block.lane + 1,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
