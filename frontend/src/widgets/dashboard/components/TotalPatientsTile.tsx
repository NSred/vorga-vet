import { useActivePatientCount } from '@/features/patients'
import { StatCardBody } from './StatCard'
import styles from './StatCards.module.css'

export function TotalPatientsTile() {
  const { count, isPending } = useActivePatientCount()

  return (
    <div className={styles.card}>
      <StatCardBody icon="🐾" label="TOTAL PATIENTS" isLoading={isPending}>
        <span className={styles.value}>{count}</span>
      </StatCardBody>
    </div>
  )
}
