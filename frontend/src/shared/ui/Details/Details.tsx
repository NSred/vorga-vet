import type { ReactNode } from 'react'
import styles from './Details.module.css'

export interface DetailSectionProps {
  title: string
  children: ReactNode
}

export interface FieldProps {
  label: string
  value?: ReactNode
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

export function DetailSection({ title, children }: DetailSectionProps) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
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
