import { useId } from 'react'
import { fieldStyles, FieldLabel } from '@/shared/ui'
import { typeLabel, typeTone } from '../lib/appointmentLabels'
import type { AppointmentType } from '../types'
import styles from './TypeCards.module.css'

export interface TypeCardsProps {
  value: AppointmentType
  onChange: (value: AppointmentType) => void
  types: readonly AppointmentType[]
}

function hint(type: AppointmentType): string {
  return type === 'surgery' ? 'Choose a duration' : '30 min'
}

export function TypeCards({ value, onChange, types }: TypeCardsProps) {
  const labelId = useId()

  return (
    <div className={fieldStyles.field}>
      <span id={labelId}>
        <FieldLabel text="Type" />
      </span>
      <div className={styles.cards} role="radiogroup" aria-labelledby={labelId}>
        {types.map((type) => {
          const checked = type === value
          return (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={checked}
              className={`${styles.card} ${styles[typeTone(type)]} ${checked ? styles.checked : ''}`}
              onClick={() => onChange(type)}
            >
              <span className={styles.dot} aria-hidden="true" />
              <span className={styles.text}>
                <span className={styles.label}>{typeLabel(type)}</span>{' '}
                <span className={styles.hint}>{hint(type)}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
