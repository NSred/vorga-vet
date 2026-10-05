import { Skeleton } from '@/shared/ui'
import { addClinicDays, clinicDateOf, clinicToday, clinicWeekRange } from '@/shared/lib/clinicTime'
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

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function WeekView({
  date,
  appointments,
  slots,
  onAppointmentClick,
  onDateSelect,
  isLoading,
  hasSlotData,
}: WeekViewProps) {
  if (isLoading) {
    return <Skeleton height="20rem" />
  }

  const weekStart = clinicDateOf(clinicWeekRange(date).from)
  const dates = Array.from({ length: 7 }, (_, index) => addClinicDays(weekStart, index))
  const { rows, days } = layoutWeek(dates, appointments, slots, hasSlotData)
  const today = clinicToday()
  const rowTemplate = `repeat(${rows.length}, var(--week-slot-height))`

  return (
    <div className={styles.scroller}>
      <div className={styles.week}>
        <div className={styles.corner} />
        {days.map((day, index) => (
          <button
            key={day.date}
            type="button"
            className={`${styles.dayHeader} ${day.date === today ? styles.todayHeader : ''}`}
            onClick={() => onDateSelect(day.date)}
            aria-label={`Open ${WEEKDAY_HEADERS[index]} ${Number(day.date.slice(8))}`}
          >
            <span>{WEEKDAY_HEADERS[index]}</span>
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
