import { Button, DatePicker, SegmentedControl } from '@/shared/ui'
import { formatDateOnly, parseDateOnly } from '@/shared/lib/dateOnly'
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
  currentDate: Date
  onDateChange: (date: Date) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

export function CalendarToolbar({
  view,
  onViewChange,
  currentDate,
  onDateChange,
  onPrev,
  onNext,
  onToday,
}: CalendarToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <SegmentedControl value={view} onChange={onViewChange} options={VIEW_OPTIONS} />

      <div className={styles.nav}>
        <button type="button" className={styles.arrow} onClick={onPrev} aria-label="Previous period">
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
        value={formatDateOnly(currentDate)}
        onChange={(next) => next && onDateChange(parseDateOnly(next))}
        className={styles.datePicker}
      />

      <Button variant="outline" type="button" disabled>
        🖨 Print
      </Button>
    </div>
  )
}
