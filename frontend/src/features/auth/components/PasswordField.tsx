import { useRef, useState, type ChangeEvent, type FocusEvent } from 'react'
import type { MascotPose } from '@/features/auth/context/AuthLayoutContext'
import styles from './AuthForm.module.css'

interface PasswordFieldProps {
  id: string
  name: string
  value: string
  autoComplete: 'current-password' | 'new-password'
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onMascotChange: (pose: MascotPose) => void
  inputRef?: (element: HTMLInputElement | null) => void
  errorId?: string
  isInvalid?: boolean
  onValidationBlur?: () => void
}

export function PasswordField({
  id,
  name,
  value,
  autoComplete,
  onChange,
  onMascotChange,
  inputRef: formInputRef,
  errorId,
  isInvalid,
  onValidationBlur,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isVisibleRef = useRef(false)

  const toggleVisibility = () => {
    const nextIsVisible = !isVisibleRef.current
    isVisibleRef.current = nextIsVisible
    setIsVisible(nextIsVisible)
    onMascotChange(nextIsVisible ? 'peeking' : 'covering')
    inputRef.current?.focus()
  }

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const blurredToToggle =
      event.relatedTarget instanceof HTMLElement && event.relatedTarget.dataset.passwordToggle

    if (!blurredToToggle) {
      onMascotChange('idle')
      onValidationBlur?.()
    }
  }

  return (
    <div className={styles.passwordWrap}>
      <input
        ref={(element) => {
          inputRef.current = element
          formInputRef?.(element)
        }}
        id={id}
        name={name}
        type={isVisible ? 'text' : 'password'}
        required
        minLength={8}
        value={value}
        onChange={onChange}
        onFocus={() => onMascotChange(isVisibleRef.current ? 'peeking' : 'covering')}
        onBlur={handleBlur}
        className={`${styles.input} ${isInvalid ? styles.inputInvalid : ''}`}
        autoComplete={autoComplete}
        placeholder="At least 8 characters"
        aria-invalid={isInvalid || undefined}
        aria-describedby={isInvalid ? errorId : undefined}
      />
      <button
        type="button"
        className={`${styles.passwordToggle} ${isVisible ? styles.passwordToggleActive : ''}`}
        onClick={toggleVisibility}
        data-password-toggle
        aria-label={isVisible ? 'Hide password' : 'Show password'}
        aria-pressed={isVisible}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {isVisible && <path d="m3 4 18 16" />}
        </svg>
      </button>
    </div>
  )
}
