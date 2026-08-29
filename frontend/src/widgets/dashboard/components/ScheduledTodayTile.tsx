import { Link } from 'react-router'
import { todayIso } from '@/shared/lib/dateOnly'
import { useTodayAppointmentCount } from '../hooks/useTodayAppointmentCount'
import { StatCardBody } from './StatCard'
import styles from './StatCards.module.css'

export function ScheduledTodayTile() {
  const { count, isPending } = useTodayAppointmentCount()

  return (
    <Link
      to={`/appointments?view=day&date=${todayIso()}`}
      className={`${styles.card} ${styles.cardClickable}`}
    >
      <StatCardBody icon="📅" label="SCHEDULED TODAY" isLoading={isPending}>
        <span className={styles.value}>{count}</span>
      </StatCardBody>
    </Link>
  )
}
