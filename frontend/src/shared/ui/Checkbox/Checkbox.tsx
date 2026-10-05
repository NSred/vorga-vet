import type { ReactNode } from 'react'
import styles from './Checkbox.module.css'

export interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
  disabled?: boolean
  className?: string
}

export function Checkbox({ checked, onChange, children, disabled, className }: CheckboxProps) {
  return (
    <label className={`${styles.checkbox} ${className ?? ''}`}>
      <input
        type="checkbox"
        className={styles.input}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      {children}
    </label>
  )
}
