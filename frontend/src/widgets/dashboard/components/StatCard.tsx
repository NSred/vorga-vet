import type { ReactNode } from 'react'
import { Skeleton } from '@/shared/ui'
import styles from './StatCards.module.css'

export interface StatCardBodyProps {
  icon: string
  label: string
  isLoading: boolean
  children: ReactNode
}

export function StatCardBody({ icon, label, isLoading, children }: StatCardBodyProps) {
  return (
    <>
      <span className={styles.label}>
        <span aria-hidden="true">{icon}</span>
        {label}
      </span>
      {isLoading ? <Skeleton width="3rem" height="1.6rem" /> : children}
    </>
  )
}
