import * as RadixSelect from '@radix-ui/react-select'
import fieldStyles from '../field.module.css'
import styles from './Select.module.css'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  id?: string
  className?: string
  hideLabel?: boolean
  placeholder?: string
  error?: string
  disabled?: boolean
}

export function Select({
  label,
  value,
  onChange,
  options,
  id,
  className,
  hideLabel,
  placeholder,
  error,
  disabled,
}: SelectProps) {
  const selectedLabel = options.find((option) => option.value === value)?.label

  return (
    <div className={`${fieldStyles.field} ${className ?? ''}`}>
      {!hideLabel && (
        <label htmlFor={id} className={fieldStyles.label}>
          {label}
        </label>
      )}
      <RadixSelect.Root
        value={value}
        onValueChange={(next) => {
          if (next === '' && !options.some((option) => option.value === '')) return
          onChange(next)
        }}
        disabled={disabled}
      >
        <RadixSelect.Trigger
          id={id}
          className={styles.trigger}
          aria-label={label}
          aria-invalid={error ? true : undefined}
        >
          <RadixSelect.Value placeholder={placeholder}>{selectedLabel}</RadixSelect.Value>
          <RadixSelect.Icon className={styles.icon}>▾</RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content className={styles.content} position="popper" sideOffset={6}>
            <RadixSelect.Viewport className={styles.viewport}>
              {options.map((option) => (
                <RadixSelect.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={styles.item}
                >
                  <span className={styles.check} aria-hidden="true">
                    <RadixSelect.ItemIndicator>✓</RadixSelect.ItemIndicator>
                  </span>
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
