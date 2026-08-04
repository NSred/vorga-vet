import { Skeleton } from '@/shared/ui'
import type { DashboardStats } from '../api/statsApi'
import styles from './StatCards.module.css'

export interface StatCardsProps {
  stats: DashboardStats | null
  isLoading: boolean
}

export function StatCards({ stats, isLoading }: StatCardsProps) {
  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <span className={styles.icon}>🐾</span>
        <span className={styles.label}>UKUPNO PACIJENATA</span>
        {isLoading || !stats ? (
          <Skeleton width="3rem" height="1.6rem" />
        ) : (
          <span className={styles.value}>{stats.totalPatients}</span>
        )}
      </div>

      <div className={styles.card}>
        <span className={styles.icon}>⏰</span>
        <span className={styles.label}>NAJTRAŽENIJI SAT</span>
        {isLoading || !stats ? (
          <Skeleton width="3rem" height="1.6rem" />
        ) : (
          <>
            <span className={styles.value}>{stats.peakHour?.hour ?? '—'}</span>
            {stats.peakHour && (
              <span className={styles.sublabel}>{stats.peakHour.count} od 10 termina</span>
            )}
          </>
        )}
      </div>

      <div className={styles.card}>
        <span className={styles.icon}>📅</span>
        <span className={styles.label}>DANAS ZAKAZANO</span>
        {isLoading || !stats ? (
          <Skeleton width="3rem" height="1.6rem" />
        ) : (
          <span className={styles.value}>{stats.todayAppointmentsCount}</span>
        )}
      </div>

      <div className={styles.card}>
        <span className={styles.icon}>⚠️</span>
        <span className={styles.label}>SA ALERGIJAMA</span>
        {isLoading || !stats ? (
          <Skeleton width="3rem" height="1.6rem" />
        ) : (
          <span className={styles.value}>{stats.allergyCount}</span>
        )}
      </div>
    </div>
  )
}
