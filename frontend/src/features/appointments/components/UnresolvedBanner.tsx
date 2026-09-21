import { Button } from '@/shared/ui'
import { useUnresolvedAppointmentsQuery } from '../hooks/useUnresolvedAppointmentsQuery'
import styles from './UnresolvedBanner.module.css'

export interface UnresolvedBannerProps {
  onOpen: () => void
}

export function UnresolvedBanner({ onOpen }: UnresolvedBannerProps) {
  const { data } = useUnresolvedAppointmentsQuery()
  const count = data?.length ?? 0

  if (count === 0) {
    return null
  }

  return (
    <div className={styles.banner} role="status">
      <span className={styles.text}>
        {count === 1 ? '1 appointment needs closing' : `${count} appointments need closing`}
      </span>
      <Button variant="outline" type="button" onClick={onOpen}>
        Review
      </Button>
    </div>
  )
}
