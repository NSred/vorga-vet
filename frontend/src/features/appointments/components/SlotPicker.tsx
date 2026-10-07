import { RadioGroup } from '@/shared/ui'
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

export function SlotPicker({ label, options, value, onChange, error, isLoading }: SlotPickerProps) {
  return (
    <RadioGroup
      label={label}
      value={value}
      onChange={onChange}
      error={error}
      placeholder={isLoading ? 'Loading free times…' : undefined}
      className={styles.grid}
      optionClassName={styles.slot}
      options={options.map((option) => ({
        value: option.value,
        label: option.label,
        disabled: option.disabled,
        ariaLabel: option.disabled && !option.isMine ? `${option.label}, taken` : undefined,
        className: option.disabled ? (option.isMine ? styles.mine : styles.taken) : undefined,
      }))}
    />
  )
}
