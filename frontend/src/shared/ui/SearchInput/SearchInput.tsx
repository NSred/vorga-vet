import type { ChangeEvent } from 'react'
import styles from './SearchInput.module.css'

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)

  return (
    <div className={styles.wrap}>
      <span className={styles.icon} aria-hidden="true">
        🔎
      </span>
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={styles.input}
        aria-label={placeholder}
      />
    </div>
  )
}
