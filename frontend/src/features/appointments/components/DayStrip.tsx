import { clinicToday, MONDAY_FIRST_WEEKDAYS } from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { plural } from '@/shared/lib/text'
import { weekDays } from '../lib/calendarDays'
import styles from './DayStrip.module.css'

export interface DayStripProps {
  date: string
  onSelect: (dateIso: string) => void
  counts?: ReadonlyMap<string, number>
  label?: string
  minDate?: string
}

export function DayStrip({ date, onSelect, counts, label = 'Day', minDate }: DayStripProps) {
  const today = clinicToday()

  return (
    <div className={styles.strip} role="group" aria-label={label}>
      {weekDays(date).map((day, index) => {
        const count = counts?.get(day) ?? 0
        const selected = day === date
        return (
          <button
            key={day}
            type="button"
            className={[
              styles.day,
              selected && styles.selected,
              day === today && !selected && styles.today,
            ]
              .filter(Boolean)
              .join(' ')}
            aria-pressed={selected}
            disabled={minDate !== undefined && day < minDate}
            aria-label={`${formatDisplayDate(day)}${count > 0 ? `, ${plural(count, 'appointment', 'appointments')}` : ''}`}
            onClick={() => onSelect(day)}
          >
            <span className={styles.weekday}>{MONDAY_FIRST_WEEKDAYS[index]}</span>
            <span className={styles.number}>{Number(day.slice(8))}</span>
            {counts && (
              <span
                className={`${styles.dot} ${count > 0 ? styles.dotOn : ''}`}
                aria-hidden="true"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
