import type { ChangeEvent } from 'react'
import { Button } from '@/shared/ui'
import { formatDateOnly, parseDateOnly } from '@/shared/lib/dateOnly'
import type { CalendarView } from '../types'
import styles from './CalendarToolbar.module.css'

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
  const handleDateInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.value) {
      onDateChange(parseDateOnly(event.target.value))
    }
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.segmented}>
        {(['day', 'week', 'month'] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={`${styles.segment} ${view === value ? styles.segmentActive : ''}`}
            onClick={() => onViewChange(value)}
          >
            {value === 'day' ? 'Day' : value === 'week' ? 'Week' : 'Month'}
          </button>
        ))}
      </div>

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

      <input
        type="date"
        value={formatDateOnly(currentDate)}
        onChange={handleDateInputChange}
        className={styles.dateInput}
        aria-label="Select date"
      />

      <Button variant="outline" type="button" disabled>
        🖨 Print
      </Button>
    </div>
  )
}
