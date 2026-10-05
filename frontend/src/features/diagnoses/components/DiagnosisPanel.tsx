import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { isApiErrorCode } from '@/shared/lib/apiClient'
import { Badge, Button, FormError, SlidePanel, TextField } from '@/shared/ui'
import {
  DUPLICATE_CODE_MESSAGE,
  DUPLICATE_DIAGNOSIS_MESSAGE,
  diagnosisErrorMessage,
  diagnosisErrors,
} from '../api/diagnosisErrors'
import { useCreateDiagnosis, useUpdateDiagnosis } from '../hooks/useDiagnosisMutations'
import {
  diagnosisValuesOf,
  emptyDiagnosisValues,
  toDiagnosisRequest,
} from '../lib/diagnosisMapping'
import type { Diagnosis, DiagnosisFormValues } from '../types'
import styles from './DiagnosisPanel.module.css'

export type DiagnosisPanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (name: string) => void
  onMissing: () => void
} & (
  | { mode: 'create' }
  | {
      mode: 'edit'
      diagnosis: Diagnosis
      onRetire: () => void
      onRestore: () => void
      isStatusPending?: boolean
    }
)

export function DiagnosisPanel(props: DiagnosisPanelProps) {
  const { open, onOpenChange, onSaved, onMissing } = props
  const diagnosis = props.mode === 'edit' ? props.diagnosis : undefined
  const create = useCreateDiagnosis()
  const update = useUpdateDiagnosis()
  const [submitError, setSubmitError] = useState<string | undefined>(undefined)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DiagnosisFormValues>({
    defaultValues: diagnosis ? diagnosisValuesOf(diagnosis) : emptyDiagnosisValues(),
  })

  useEffect(() => {
    if (open) {
      reset(diagnosis ? diagnosisValuesOf(diagnosis) : emptyDiagnosisValues())
      setSubmitError(undefined)
    }
  }, [open, diagnosis, reset])

  const submit = handleSubmit(async (values) => {
    setSubmitError(undefined)
    const request = toDiagnosisRequest(values)

    try {
      if (diagnosis) await update.mutateAsync({ id: diagnosis.id, request })
      else await create.mutateAsync(request)
      onSaved(request.name)
    } catch (error: unknown) {
      if (isApiErrorCode(error, diagnosisErrors.nameNotUnique)) {
        setError('name', { message: DUPLICATE_DIAGNOSIS_MESSAGE })
        return
      }
      if (isApiErrorCode(error, diagnosisErrors.codeNotUnique)) {
        setError('code', { message: DUPLICATE_CODE_MESSAGE })
        return
      }
      if (isApiErrorCode(error, diagnosisErrors.notFound)) {
        onMissing()
        return
      }
      setSubmitError(diagnosisErrorMessage(error, 'Could not save the diagnosis.'))
    }
  })

  const isPending = isSubmitting || create.isPending || update.isPending
  const title = diagnosis ? 'Edit diagnosis' : 'New diagnosis'

  return (
    <SlidePanel
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel={title}
      headerTone="plain"
      header={
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>
          {diagnosis && !diagnosis.isActive && <Badge tone="neutral">Retired</Badge>}
        </div>
      }
      footer={
        <>
          {props.mode === 'edit' && (
            <div className={styles.statusAction}>
              {props.diagnosis.isActive ? (
                <Button
                  variant="danger"
                  type="button"
                  onClick={props.onRetire}
                  disabled={props.isStatusPending}
                >
                  Retire
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  type="button"
                  onClick={props.onRestore}
                  disabled={props.isStatusPending}
                >
                  Restore
                </Button>
              )}
            </div>
          )}
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="diagnosis-form" disabled={isPending}>
            Save
          </Button>
        </>
      }
    >
      <form id="diagnosis-form" onSubmit={submit} className={styles.form} noValidate>
        <TextField
          id="diagnosis-name"
          label="Name *"
          {...register('name', {
            validate: (value) => {
              const trimmed = value.trim()
              if (!trimmed) return 'Name is required'
              if (trimmed.length > 200) return 'Maximum 200 characters'
              return true
            },
          })}
          error={errors.name?.message}
        />
        <TextField
          id="diagnosis-code"
          label="Code"
          placeholder="Optional, e.g. D12"
          className={styles.code}
          {...register('code', {
            validate: (value) => value.trim().length <= 20 || 'Maximum 20 characters',
          })}
          error={errors.code?.message}
        />
        <FormError message={submitError} />
      </form>
    </SlidePanel>
  )
}
