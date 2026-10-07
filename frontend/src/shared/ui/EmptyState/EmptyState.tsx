import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

export interface EmptyStateProps {
  message: string
  action?: ReactNode
  icon?: string
  hint?: string
}

export function EmptyState({ message, action, icon, hint }: EmptyStateProps) {
  return (
    <div className={`${styles.emptyState} ${icon ? styles.card : ''}`}>
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <p className={icon ? styles.title : styles.message}>{message}</p>
      {hint && <p className={styles.hint}>{hint}</p>}
      {action}
    </div>
  )
}
