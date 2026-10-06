import type { ReactNode } from 'react'
import styles from './RecordList.module.css'

export interface RecordListProps {
  label: string
  children: ReactNode
}

export interface RecordItemProps {
  title: ReactNode
  meta?: ReactNode
  actions?: ReactNode
  faded?: boolean
}

export function RecordList({ label, children }: RecordListProps) {
  return (
    <ul className={styles.list} aria-label={label}>
      {children}
    </ul>
  )
}

export function RecordItem({ title, meta, actions, faded = false }: RecordItemProps) {
  return (
    <li className={`${styles.item} ${faded ? styles.faded : ''}`}>
      <div className={styles.main}>
        <span className={styles.title}>{title}</span>
        {meta && <span className={styles.meta}>{meta}</span>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </li>
  )
}
