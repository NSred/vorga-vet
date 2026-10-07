import type { ReactNode } from 'react'
import styles from './Details.module.css'

export interface DetailSectionProps {
  title?: string
  count?: number
  action?: ReactNode
  children: ReactNode
}

export interface FieldProps {
  label: string
  value?: ReactNode
}

export interface TileProps extends FieldProps {
  unit?: string
}

function isBlank(value: ReactNode): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (typeof value === 'number' && Number.isNaN(value)) ||
    (Array.isArray(value) && value.length === 0)
  )
}

export function DetailSection({ title, count, action, children }: DetailSectionProps) {
  const hasHeading = Boolean(title || action)

  return (
    <section className={styles.section}>
      {hasHeading && (
        <div className={styles.heading}>
          {title && <h3 className={styles.sectionTitle}>{title}</h3>}
          {count !== undefined && (
            <span className={styles.count} aria-label={`${count} ${title ?? ''}`.trim()}>
              {count}
            </span>
          )}
          {action && <div className={styles.action}>{action}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className={styles.grid}>{children}</div>
}

export function Field({ label, value }: FieldProps) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{isBlank(value) ? '—' : value}</span>
    </div>
  )
}

export function Tile({ label, value, unit }: TileProps) {
  const blank = isBlank(value)

  return (
    <div className={styles.tile}>
      <span className={styles.label}>{label}</span>
      <span className={styles.tileValue}>
        {blank ? '—' : value}
        {!blank && unit && <span className={styles.unit}> {unit}</span>}
      </span>
    </div>
  )
}
