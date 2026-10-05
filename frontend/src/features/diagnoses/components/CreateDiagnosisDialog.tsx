import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { isApiErrorCode } from '@/shared/lib/apiClient'
import { Button, FormError, Modal, TextField } from '@/shared/ui'
import {
  DUPLICATE_CODE_MESSAGE,
  DUPLICATE_DIAGNOSIS_MESSAGE,
  diagnosisErrorMessage,
  diagnosisErrors,
} from '../api/diagnosisErrors'
import { useCreateDiagnosis } from '../hooks/useDiagnosisMutations'
import styles from './CreateDiagnosisDialog.module.css'

export interface CreateDiagnosisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialName: string
  onCreated: (name: string) => void
  onUseWithoutAdding: (name: string) => void
}

interface FormValues {
  name: string
  code: string
}

function nameError(value: string): string | true {
  const trimmed = value.trim()
  if (!trimmed) return 'Name is required'
  if (trimmed.length > 200) return 'Maximum 200 characters'
  return true
}

export function CreateDiagnosisDialog({
  open,
  onOpenChange,
  initialName,
  onCreated,
  onUseWithoutAdding,
}: CreateDiagnosisDialogProps) {
  const create = useCreateDiagnosis()
  const [submitError, setSubmitError] = useState<string | undefined>(undefined)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>()

  useEffect(() => {
    if (open) {
      reset({ name: initialName, code: '' })
      setSubmitError(undefined)
    }
  }, [open, initialName, reset])

  const submit = handleSubmit(async (values) => {
    setSubmitError(undefined)
    const name = values.name.trim()
    const code = values.code.trim()

    try {
      await create.mutateAsync({ name, code: code || null })
      onCreated(name)
    } catch (error: unknown) {
      if (isApiErrorCode(error, diagnosisErrors.nameNotUnique)) {
        setError('name', { message: DUPLICATE_DIAGNOSIS_MESSAGE })
        return
      }
      if (isApiErrorCode(error, diagnosisErrors.codeNotUnique)) {
        setError('code', { message: DUPLICATE_CODE_MESSAGE })
        return
      }
      setSubmitError(diagnosisErrorMessage(error, 'Could not add the diagnosis.'))
    }
  })

  const keepAsTyped = async () => {
    if (await trigger('name')) onUseWithoutAdding(getValues('name').trim())
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New diagnosis"
      description="The diagnosis is added to the diagnosis list and to this exam."
      footer={
        <>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="secondary" type="button" onClick={() => void keepAsTyped()}>
            Use without adding
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="create-diagnosis-form"
            disabled={isSubmitting || create.isPending}
          >
            Add to diagnosis list
          </Button>
        </>
      }
    >
      <form
        id="create-diagnosis-form"
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.stopPropagation()
          void submit(event)
        }}
      >
        <TextField
          id="new-diagnosis-name"
          label="Name *"
          {...register('name', { validate: nameError })}
          error={errors.name?.message}
        />
        <TextField
          id="new-diagnosis-code"
          label="Code"
          placeholder="Optional, e.g. D12"
          {...register('code', {
            validate: (value) => value.trim().length <= 20 || 'Maximum 20 characters',
          })}
          error={errors.code?.message}
        />
        <FormError message={submitError} />
      </form>
    </Modal>
  )
}
