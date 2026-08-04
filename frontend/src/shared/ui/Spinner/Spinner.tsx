import styles from './Spinner.module.css'

export interface SpinnerProps {
  size?: 'sm' | 'md'
  label?: string
}

export function Spinner({ size = 'md', label = 'Učitavanje…' }: SpinnerProps) {
  return <span role="status" aria-label={label} className={`${styles.spinner} ${styles[size]}`} />
}
