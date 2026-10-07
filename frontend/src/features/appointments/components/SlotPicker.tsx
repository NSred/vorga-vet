import { useId } from 'react'
import { fieldStyles, FieldLabel } from '@/shared/ui'
import type { SlotOption } from '../lib/slotOptions'
import styles from './SlotPicker.module.css'

export interface SlotPickerProps {
  label: string
  options: SlotOption[]
  value: string
  onChange: (value: string) => void
  error?: string
  isLoading?: boolean
}

function slotName(option: SlotOption): string {
  if (!option.disabled) return option.label
  return option.isMine ? option.label : `${option.label}, taken`
}

export function SlotPicker({ label, options, value, onChange, error, isLoading }: SlotPickerProps) {
  const labelId = useId()

  return (
    <div className={fieldStyles.field}>
      <span id={labelId}>
        <FieldLabel text={label} />
      </span>
      {isLoading ? (
        <p className={styles.note}>Loading free times…</p>
      ) : (
        <div
          className={styles.grid}
          role="radiogroup"
          aria-labelledby={labelId}
          aria-invalid={error ? true : undefined}
        >
          {options.map((option) => {
            const checked = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={slotName(option)}
                disabled={option.disabled}
                className={[
                  styles.slot,
                  checked && styles.checked,
                  option.disabled && !option.isMine && styles.taken,
                  option.disabled && option.isMine && styles.mine,
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onChange(option.value)}
              >
                {option.label}
              </button>
            )
          })}
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
