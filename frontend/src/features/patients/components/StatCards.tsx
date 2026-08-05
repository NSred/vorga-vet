import { Link } from 'react-router'
import { Skeleton } from '@/shared/ui'
import { todayIso } from '@/shared/lib/dateOnly'
import type { DashboardStats } from '../api/statsApi'
import styles from './StatCards.module.css'

export interface StatCardsProps {
  stats: DashboardStats | null
  isLoading: boolean
  onPeakHoursClick: () => void
}

export function StatCards({ stats, isLoading, onPeakHoursClick }: StatCardsProps) {
  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <span className={styles.icon}>🐾</span>
        <span className={styles.label}>TOTAL PATIENTS</span>
        {isLoading || !stats ? (
          <Skeleton width="3rem" height="1.6rem" />
        ) : (
          <span className={styles.value}>{stats.totalPatients}</span>
        )}
      </div>

      <button type="button" className={`${styles.card} ${styles.cardButton}`} onClick={onPeakHoursClick}>
        <span className={styles.icon}>⏰</span>
        <span className={styles.label}>PEAK HOUR</span>
        {isLoading || !stats ? (
          <Skeleton width="3rem" height="1.6rem" />
        ) : (
          <>
            <span className={styles.value}>{stats.peakHour?.hour ?? '—'}</span>
            {stats.peakHour && (
              <span className={styles.sublabel}>
                {stats.peakHour.count} of {stats.todayAppointmentsCount} appointments
              </span>
            )}
          </>
        )}
      </button>

      <Link to={`/appointments?view=day&date=${todayIso()}`} className={styles.card}>
        <span className={styles.icon}>📅</span>
        <span className={styles.label}>SCHEDULED TODAY</span>
        {isLoading || !stats ? (
          <Skeleton width="3rem" height="1.6rem" />
        ) : (
          <span className={styles.value}>{stats.todayAppointmentsCount}</span>
        )}
      </Link>

      <div className={styles.card}>
        <span className={styles.icon}>⚠️</span>
        <span className={styles.label}>WITH ALLERGIES</span>
        {isLoading || !stats ? (
          <Skeleton width="3rem" height="1.6rem" />
        ) : (
          <span className={styles.value}>{stats.allergyCount}</span>
        )}
      </div>
    </div>
  )
}
