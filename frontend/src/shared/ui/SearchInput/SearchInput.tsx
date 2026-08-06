import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import styles from './SearchInput.module.css'

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  const [isActive, setIsActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const blurTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(blurTimeout.current), [])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)

  const handleFocus = () => {
    clearTimeout(blurTimeout.current)
    setIsActive(true)
  }

  const handleBlur = () => {
    // Deferred so a click on the clear button still registers before the box collapses.
    blurTimeout.current = setTimeout(() => setIsActive(false), 120)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      inputRef.current?.blur()
    }
  }

  const handleClear = () => {
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <div className={`${styles.box} ${isActive ? styles.active : ''}`}>
      <svg className={styles.icon} width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="8.5" cy="8.5" r="6" strokeWidth="1.8" />
        <line x1="13.2" y1="13.2" x2="18" y2="18" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={styles.input}
        aria-label={placeholder}
      />
      {value.length > 0 && (
        <button type="button" className={styles.clear} aria-label="Clear search" onClick={handleClear}>
          ×
        </button>
      )}
    </div>
  )
}
