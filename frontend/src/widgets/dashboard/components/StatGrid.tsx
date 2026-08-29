import type { ReactNode } from 'react'
import styles from './StatCards.module.css'

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className={styles.grid}>{children}</div>
}
