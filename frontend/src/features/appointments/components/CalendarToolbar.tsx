import { Button, DatePicker, SegmentedControl } from '@/shared/ui'
import type { CalendarView } from '../types'
import styles from './CalendarToolbar.module.css'

const VIEW_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
] as const

export interface CalendarToolbarProps {
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  currentDate: string
  onDateChange: (dateIso: string) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  showCancelled: boolean
  onShowCancelledChange: (value: boolean) => void
  onNewAppointment?: () => void
  onWalkIn?: () => void
}

export function CalendarToolbar({
  view,
  onViewChange,
  currentDate,
  onDateChange,
  onPrev,
  onNext,
  onToday,
  showCancelled,
  onShowCancelledChange,
  onNewAppointment,
  onWalkIn,
}: CalendarToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <SegmentedControl value={view} onChange={onViewChange} options={VIEW_OPTIONS} />

      <div className={styles.nav}>
        <button
          type="button"
          className={styles.arrow}
          onClick={onPrev}
          aria-label="Previous period"
        >
          ‹
        </button>
        <Button variant="outline" type="button" onClick={onToday}>
          Today
        </Button>
        <button type="button" className={styles.arrow} onClick={onNext} aria-label="Next period">
          ›
        </button>
      </div>

      <DatePicker
        id="calendar-date"
        label="Select date"
        hideLabel
        value={currentDate}
        onChange={(next) => next && onDateChange(next)}
        className={styles.datePicker}
      />

      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={showCancelled}
          onChange={(event) => onShowCancelledChange(event.target.checked)}
        />
        Show cancelled
      </label>

      {onNewAppointment && (
        <Button variant="primary" type="button" onClick={onNewAppointment}>
          ＋ New appointment
        </Button>
      )}
      {onWalkIn && (
        <Button variant="outline" type="button" onClick={onWalkIn}>
          Walk-in
        </Button>
      )}
    </div>
  )
}
