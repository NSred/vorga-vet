import { useState } from 'react'
import { DatePicker, TextField } from '@/shared/ui'
import { birthDateForAge, wholeYears } from '../lib/patientAge'
import styles from './BirthDateField.module.css'

export interface BirthDateFieldProps {
  id: string
  value?: string
  onChange: (birthDate: string) => void
  maxDate?: string
  error?: string
}

const MAX_AGE = 100
const WHOLE_NUMBER = /^\d{1,3}$/

function ageText(birthDate?: string): string {
  const years = wholeYears(birthDate)
  return years === undefined ? '' : String(years)
}

export function BirthDateField({ id, value, onChange, maxDate, error }: BirthDateFieldProps) {
  const [draft, setDraft] = useState(() => ageText(value))
  const [syncedValue, setSyncedValue] = useState(value)

  if (syncedValue !== value) {
    setSyncedValue(value)
    setDraft(ageText(value))
  }

  const changeAge = (text: string) => {
    setDraft(text)
    const trimmed = text.trim()

    if (trimmed === '') {
      onChange('')
      return
    }

    if (!WHOLE_NUMBER.test(trimmed)) return
    const years = Number(trimmed)
    if (years > MAX_AGE) return

    const birthDate = birthDateForAge(years)
    setSyncedValue(birthDate)
    onChange(birthDate)
  }

  return (
    <div className={styles.field}>
      <div className={styles.pair}>
        <TextField
          id={`${id}-age`}
          label="Age"
          suffix="yrs"
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_AGE}
          step={1}
          value={draft}
          onChange={(event) => changeAge(event.target.value)}
        />
        <DatePicker
          id={id}
          label="Date of birth"
          value={value || undefined}
          onChange={onChange}
          maxDate={maxDate}
          error={error}
        />
      </div>
    </div>
  )
}
