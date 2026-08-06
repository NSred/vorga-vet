import * as Popover from '@radix-ui/react-popover'
import {
  addDays,
  addMonths,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  getYear,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
} from 'date-fns'
import { useState } from 'react'
import { formatDateOnly, formatDisplayDate, parseDateOnly } from '@/shared/lib/dateOnly'
import styles from './DatePicker.module.css'

export interface DatePickerProps {
  id: string
  label: string
  value?: string
  onChange: (value: string) => void
  error?: string
  hideLabel?: boolean
  placeholder?: string
  className?: string
}

const WEEKDAY_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function buildDayGrid(displayDate: Date): Date[] {
  const monthStart = startOfMonth(displayDate)
  const monthEnd = endOfMonth(displayDate)
  const leadingBlanks = (getDay(monthStart) + 6) % 7
  const gridStart = addDays(monthStart, -leadingBlanks)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd }).length
  const totalCells = Math.ceil((leadingBlanks + daysInMonth) / 7) * 7
  const gridEnd = addDays(gridStart, totalCells - 1)
  return eachDayOfInterval({ start: gridStart, end: gridEnd })
}

export function DatePicker({
  id,
  label,
  value,
  onChange,
  error,
  hideLabel,
  placeholder = 'Select date',
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'days' | 'months'>('days')
  const [displayDate, setDisplayDate] = useState<Date>(() => (value ? parseDateOnly(value) : new Date()))

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setDisplayDate(value ? parseDateOnly(value) : new Date())
      setView('days')
    }
  }

  const handleSelectDay = (day: Date) => {
    onChange(formatDateOnly(day))
    setOpen(false)
  }

  const handleSelectMonth = (monthDate: Date) => {
    setDisplayDate(monthDate)
    setView('days')
  }

  const handleClear = () => {
    onChange('')
    setOpen(false)
  }

  const selectedDate = value ? parseDateOnly(value) : undefined
  const gridDays = buildDayGrid(displayDate)

  return (
    <div className={`${styles.field} ${className ?? ''}`}>
      {!hideLabel && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <Popover.Root open={open} onOpenChange={handleOpenChange}>
        <Popover.Trigger
          id={id}
          type="button"
          className={`${styles.trigger} ${error ? styles.triggerInvalid : ''}`}
          aria-invalid={Boolean(error) || undefined}
          aria-label={hideLabel ? label : undefined}
        >
          <svg className={styles.icon} width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="3" y="4.5" width="14" height="12.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 8h14" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6.5 2.5v3M13.5 2.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className={value ? styles.value : styles.placeholder}>
            {value ? formatDisplayDate(value) : placeholder}
          </span>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content className={styles.content} align="start" sideOffset={6}>
            {view === 'days' ? (
              <>
                <div className={styles.nav}>
                  <button
                    type="button"
                    className={styles.navArrow}
                    onClick={() => setDisplayDate((prev) => addMonths(prev, -1))}
                    aria-label="Previous month"
                  >
                    ‹
                  </button>
                  <button type="button" className={styles.navLabel} onClick={() => setView('months')}>
                    {format(displayDate, 'MMMM yyyy')}
                  </button>
                  <button
                    type="button"
                    className={styles.navArrow}
                    onClick={() => setDisplayDate((prev) => addMonths(prev, 1))}
                    aria-label="Next month"
                  >
                    ›
                  </button>
                </div>

                <div className={styles.weekdays}>
                  {WEEKDAY_HEADERS.map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>

                <div className={styles.days}>
                  {gridDays.map((day) => {
                    const inMonth = isSameMonth(day, displayDate)
                    const selected = selectedDate ? isSameDay(day, selectedDate) : false
                    const today = isToday(day)
                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        className={[
                          styles.day,
                          !inMonth && styles.dayMuted,
                          selected && styles.daySelected,
                          today && !selected && styles.dayToday,
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => handleSelectDay(day)}
                      >
                        {day.getDate()}
                      </button>
                    )
                  })}
                </div>

                <div className={styles.footer}>
                  <button type="button" className={styles.clear} onClick={handleClear}>
                    Clear
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.nav}>
                  <button
                    type="button"
                    className={styles.navArrow}
                    onClick={() => setDisplayDate((prev) => addYears(prev, -1))}
                    aria-label="Previous year"
                  >
                    ‹
                  </button>
                  <span className={styles.navLabel}>{getYear(displayDate)}</span>
                  <button
                    type="button"
                    className={styles.navArrow}
                    onClick={() => setDisplayDate((prev) => addYears(prev, 1))}
                    aria-label="Next year"
                  >
                    ›
                  </button>
                </div>

                <div className={styles.months}>
                  {MONTH_LABELS.map((monthLabel, index) => {
                    const monthDate = new Date(getYear(displayDate), index, 1)
                    const isCurrent = isSameMonth(monthDate, displayDate)
                    return (
                      <button
                        key={monthLabel}
                        type="button"
                        className={`${styles.month} ${isCurrent ? styles.monthActive : ''}`}
                        onClick={() => handleSelectMonth(monthDate)}
                      >
                        {monthLabel}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
