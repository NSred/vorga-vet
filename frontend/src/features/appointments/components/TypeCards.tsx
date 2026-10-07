import { RadioGroup } from '@/shared/ui'
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
  return (
    <RadioGroup
      label="Type"
      value={value}
      onChange={onChange}
      className={styles.cards}
      optionClassName={styles.card}
      options={types.map((type) => ({
        value: type,
        className: styles[typeTone(type)],
        label: (
          <>
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.text}>
              <span className={styles.label}>{typeLabel(type)}</span>{' '}
              <span className={styles.hint}>{hint(type)}</span>
            </span>
          </>
        ),
      }))}
    />
  )
}
