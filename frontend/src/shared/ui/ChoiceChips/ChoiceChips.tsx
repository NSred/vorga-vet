import { useId } from 'react'
import { FieldLabel } from '../FieldLabel/FieldLabel'
import fieldStyles from '../field.module.css'
import styles from './ChoiceChips.module.css'

export interface ChoiceChipOption<T extends string> {
  value: T
  label: string
}

export interface ChoiceChipsProps<T extends string> {
  label: string
  value: T
  options: readonly ChoiceChipOption<T>[]
  onChange: (value: T) => void
}

export function ChoiceChips<T extends string>({
  label,
  value,
  options,
  onChange,
}: ChoiceChipsProps<T>) {
  const labelId = useId()

  return (
    <div className={fieldStyles.field}>
      <span id={labelId}>
        <FieldLabel text={label} />
      </span>
      <div className={styles.chips} role="radiogroup" aria-labelledby={labelId}>
        {options.map((option) => {
          const checked = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={checked}
              className={`${styles.chip} ${checked ? styles.checked : ''}`}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
