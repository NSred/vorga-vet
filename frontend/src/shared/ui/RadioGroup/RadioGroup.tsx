import { useId, type ReactNode } from 'react'
import { FieldLabel } from '../FieldLabel/FieldLabel'
import fieldStyles from '../field.module.css'
import styles from './RadioGroup.module.css'

export interface RadioOption<T extends string> {
  value: T
  label: ReactNode
  ariaLabel?: string
  disabled?: boolean
  className?: string
}

export interface RadioGroupProps<T extends string> {
  label: string
  value: T
  options: readonly RadioOption<T>[]
  onChange: (value: T) => void
  error?: string
  placeholder?: string
  className?: string
  optionClassName?: string
}

export function RadioGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  error,
  placeholder,
  className = styles.chips,
  optionClassName = styles.chip,
}: RadioGroupProps<T>) {
  const labelId = useId()

  return (
    <div className={fieldStyles.field}>
      <FieldLabel id={labelId} text={label} />
      {placeholder ? (
        <p className={styles.placeholder}>{placeholder}</p>
      ) : (
        <div
          className={className}
          role="radiogroup"
          aria-labelledby={labelId}
          aria-invalid={error ? true : undefined}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={option.value === value}
              aria-label={option.ariaLabel}
              disabled={option.disabled}
              className={`${styles.option} ${optionClassName} ${option.className ?? ''}`}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p className={fieldStyles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
