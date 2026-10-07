import { forwardRef, type InputHTMLAttributes } from 'react'
import { FieldLabel } from '../FieldLabel/FieldLabel'
import fieldStyles from '../field.module.css'
import styles from './TextField.module.css'

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  id: string
  hideLabel?: boolean
  compact?: boolean
  invalid?: boolean
  suffix?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    error,
    id,
    className,
    hideLabel = false,
    compact = false,
    invalid = false,
    suffix,
    ...rest
  },
  ref,
) {
  const isInvalid = Boolean(error) || invalid
  const invalidClass = isInvalid ? fieldStyles.shellInvalid : ''

  const input = (
    <input
      ref={ref}
      id={id}
      className={suffix ? styles.bare : `${styles.input} ${invalidClass}`}
      aria-invalid={isInvalid || undefined}
      aria-label={hideLabel ? label : undefined}
      {...rest}
    />
  )

  return (
    <div className={`${fieldStyles.field} ${compact ? styles.compact : ''} ${className ?? ''}`}>
      {!hideLabel && <FieldLabel text={label} htmlFor={id} />}
      {suffix ? (
        <div className={`${styles.affixed} ${invalidClass}`}>
          {input}
          <span className={styles.suffix}>{suffix}</span>
        </div>
      ) : (
        input
      )}
      {error && (
        <p className={fieldStyles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
})
