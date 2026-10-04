import { usePeakHourToday } from '../hooks/usePeakHourToday'
import { useTodayAppointmentCount } from '../hooks/useTodayAppointmentCount'
import { StatCardBody } from './StatCard'
import styles from './StatCards.module.css'

export interface PeakHourTileProps {
  onOpenBreakdown: () => void
}

export function PeakHourTile({ onOpenBreakdown }: PeakHourTileProps) {
  const { peakHour, isPending } = usePeakHourToday()
  const { count } = useTodayAppointmentCount()

  return (
    <button
      type="button"
      className={`${styles.card} ${styles.cardButton} ${styles.cardClickable}`}
      onClick={onOpenBreakdown}
    >
      <StatCardBody icon="⏰" label="PEAK HOUR" isLoading={isPending}>
        <>
          <span className={styles.value}>{peakHour?.hour ?? '—'}</span>
          {peakHour && (
            <span className={styles.sublabel}>
              {peakHour.count} of {count} appointments
            </span>
          )}
        </>
      </StatCardBody>
    </button>
  )
}
