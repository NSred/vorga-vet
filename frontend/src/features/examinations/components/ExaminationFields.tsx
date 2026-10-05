import type { ReactNode } from 'react'
import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import { TextField, Textarea } from '@/shared/ui'
import type { DiagnosisFieldProps, ExaminationFormValues } from '../types'
import styles from './ExaminationFields.module.css'

export interface ExaminationFieldsProps {
  register: UseFormRegister<ExaminationFormValues>
  control: Control<ExaminationFormValues>
  errors: FieldErrors<ExaminationFormValues>
  renderDiagnosis: (field: DiagnosisFieldProps) => ReactNode
  costSection: ReactNode
}

const TEXT_LIMIT = { value: 4000, message: 'Maximum 4000 characters' }

export function ExaminationFields({
  register,
  control,
  errors,
  renderDiagnosis,
  costSection,
}: ExaminationFieldsProps) {
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
      <Controller
        name="diagnosis"
        control={control}
        rules={{ maxLength: TEXT_LIMIT }}
        render={({ field }) => (
          <>
            {renderDiagnosis({
              value: field.value,
              onChange: field.onChange,
              error: errors.diagnosis?.message,
            })}
          </>
        )}
      />
      <Textarea
        id="therapy"
        label="Therapy"
        placeholder="Instructions for the owner, follow-up…"
        {...register('therapy', { maxLength: TEXT_LIMIT })}
        error={errors.therapy?.message}
      />

      {costSection}
    </div>
  )
}
