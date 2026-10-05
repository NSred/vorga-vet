import { Select } from '@/shared/ui'
import { MEDICATION_UNITS } from '../lib/units'

export interface UnitSelectProps {
  id: string
  value: string
  onChange: (unit: string) => void
}

const NO_UNIT = 'none'

export function UnitSelect({ id, value, onChange }: UnitSelectProps) {
  const units: string[] = [...MEDICATION_UNITS]
  if (value && !units.includes(value)) units.push(value)

  return (
    <Select
      id={id}
      label="Unit"
      value={value || NO_UNIT}
      onChange={(next) => onChange(next === NO_UNIT ? '' : next)}
      options={[
        { value: NO_UNIT, label: 'No unit' },
        ...units.map((unit) => ({ value: unit, label: unit })),
      ]}
    />
  )
}
