import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { TextField, Textarea } from '@/shared/ui'
import type { ExaminationFormValues } from '../types'
import styles from './ExaminationFields.module.css'

export interface ExaminationFieldsProps {
  register: UseFormRegister<ExaminationFormValues>
  errors: FieldErrors<ExaminationFormValues>
}

const TEXT_LIMIT = { value: 4000, message: 'Maximum 4000 characters' }

export function ExaminationFields({ register, errors }: ExaminationFieldsProps) {
  return (
    <div className={styles.fields}>
      <div className={styles.row}>
        <TextField
          id="performedByFirstName"
          label="Performed by, first name *"
          {...register('performedByFirstName', {
            required: 'First name is required',
            maxLength: { value: 100, message: 'Maximum 100 characters' },
          })}
          error={errors.performedByFirstName?.message}
        />
        <TextField
          id="performedByLastName"
          label="Performed by, last name *"
          {...register('performedByLastName', {
            required: 'Last name is required',
            maxLength: { value: 100, message: 'Maximum 100 characters' },
          })}
          error={errors.performedByLastName?.message}
        />
      </div>

      <Textarea
        id="anamnesis"
        label="Anamnesis"
        placeholder="What the owner reports, history…"
        {...register('anamnesis', { maxLength: TEXT_LIMIT })}
        error={errors.anamnesis?.message}
      />
      <Textarea
        id="diagnosis"
        label="Diagnosis"
        {...register('diagnosis', { maxLength: TEXT_LIMIT })}
        error={errors.diagnosis?.message}
      />
      <Textarea
        id="therapy"
        label="Therapy"
        placeholder="Medication, dosage, follow-up…"
        {...register('therapy', { maxLength: TEXT_LIMIT })}
        error={errors.therapy?.message}
      />

      <TextField
        id="cost"
        label="Cost"
        inputMode="decimal"
        placeholder="0.00"
        className={styles.cost}
        {...register('cost', {
          validate: (value) => {
            const text = value.trim().replace(',', '.')
            if (!text) return true
            const cost = Number(text)
            return Number.isFinite(cost) && cost >= 0 ? true : 'Enter an amount of 0 or more'
          },
        })}
        error={errors.cost?.message}
      />
    </div>
  )
}
