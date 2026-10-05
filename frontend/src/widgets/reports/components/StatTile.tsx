import type { ReactNode } from 'react'
import styles from './Reports.module.css'

export interface StatTileProps {
  label: string
  tone?: 'neutral' | 'ok' | 'warn'
  children: ReactNode
}

const TONE = { neutral: styles.toneNeutral, ok: styles.toneOk, warn: styles.toneWarn }

export function StatTile({ label, tone = 'neutral', children }: StatTileProps) {
  return (
    <div className={`${styles.tile} ${TONE[tone]}`}>
      <dt className={styles.tileLabel}>{label}</dt>
      <dd className={styles.tileValue}>{children}</dd>
    </div>
  )
}
