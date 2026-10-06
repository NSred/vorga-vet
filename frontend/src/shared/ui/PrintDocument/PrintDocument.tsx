import type { ReactNode } from 'react'
import styles from './PrintDocument.module.css'

export interface PrintDocumentProps {
  issuer: string
  title: string
  reference: string
  footerLines: string[]
  signatures: string[]
  footerLayout?: 'inline' | 'stacked'
  children: ReactNode
}

export interface PrintSectionProps {
  title?: string
  children: ReactNode
}

export interface PrintFieldProps {
  label: string
  value?: string | null
}

export function PrintDocument({
  issuer,
  title,
  reference,
  footerLines,
  signatures,
  footerLayout = 'inline',
  children,
}: PrintDocumentProps) {
  return (
    <article className={styles.page} aria-label={title}>
      <header className={styles.header}>
        <div className={styles.issuer}>{issuer}</div>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.reference}>{reference}</div>
      </header>

      {children}

      <footer className={`${styles.footer} ${styles[`footer_${footerLayout}`]}`}>
        <div>
          {footerLines.map((line) => (
            <p key={line} className={styles.footLine}>
              {line}
            </p>
          ))}
        </div>
        <div className={styles.signatures}>
          {signatures.map((signature) => (
            <div key={signature} className={styles.signature}>
              {signature}
            </div>
          ))}
        </div>
      </footer>
    </article>
  )
}

export function PrintSection({ title, children }: PrintSectionProps) {
  return (
    <section className={styles.section}>
      {title && <h2 className={styles.sectionTitle}>{title}</h2>}
      <dl className={styles.grid}>{children}</dl>
    </section>
  )
}

export function PrintField({ label, value }: PrintFieldProps) {
  return (
    <div className={styles.row}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{value || '—'}</dd>
    </div>
  )
}
