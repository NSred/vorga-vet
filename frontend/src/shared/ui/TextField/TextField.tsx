import { forwardRef, type InputHTMLAttributes } from 'react'
import fieldStyles from '../field.module.css'
import styles from './TextField.module.css'

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  id: string
  hideLabel?: boolean
  compact?: boolean
  invalid?: boolean
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, id, className, hideLabel = false, compact = false, invalid = false, ...rest },
  ref,
) {
  const isInvalid = Boolean(error) || invalid

  return (
    <div className={`${fieldStyles.field} ${compact ? styles.compact : ''} ${className ?? ''}`}>
      {!hideLabel && (
        <label htmlFor={id} className={fieldStyles.label}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`${styles.input} ${isInvalid ? styles.inputInvalid : ''}`}
        aria-invalid={isInvalid || undefined}
        aria-label={hideLabel ? label : undefined}
        {...rest}
      />
      {error && (
        <p className={fieldStyles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
})
