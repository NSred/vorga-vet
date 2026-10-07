import type { ReactNode } from 'react'
import styles from './PageHeader.module.css'

export type MobileActions = 'bar' | 'floating' | 'inline'

export interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  mobileActions?: MobileActions
}

export function PageHeader({ title, subtitle, actions, mobileActions = 'bar' }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && (
        <div className={styles.actions} data-action-bar={mobileActions}>
          {actions}
        </div>
      )}
    </div>
  )
}
