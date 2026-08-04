import * as RadixSelect from '@radix-ui/react-select'
import styles from './Select.module.css'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  id?: string
  className?: string
}

export function Select({ label, value, onChange, options, id, className }: SelectProps) {
  return (
    <div className={`${styles.field} ${className ?? ''}`}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <RadixSelect.Root value={value} onValueChange={onChange}>
        <RadixSelect.Trigger id={id} className={styles.trigger} aria-label={label}>
          <RadixSelect.Value />
          <RadixSelect.Icon className={styles.icon}>▾</RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content className={styles.content} position="popper" sideOffset={4}>
            <RadixSelect.Viewport>
              {options.map((option) => (
                <RadixSelect.Item key={option.value} value={option.value} className={styles.item}>
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </div>
  )
}
