import type { ReactNode } from 'react'
import styles from './EntityHeader.module.css'

export interface EntityHeaderProps {
  title: ReactNode
  eyebrow?: ReactNode
  avatar?: ReactNode
  subtitle?: ReactNode
  chips?: ReactNode
}

export function EntityHeader({ title, eyebrow, avatar, subtitle, chips }: EntityHeaderProps) {
  return (
    <div className={styles.header}>
      {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
      <div className={styles.main}>
        {avatar && (
          <span className={styles.avatar} aria-hidden="true">
            {avatar}
          </span>
        )}
        <div className={styles.text}>
          <div className={styles.title}>{title}</div>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>
      </div>
      {chips && <div className={styles.chips}>{chips}</div>}
    </div>
  )
}
