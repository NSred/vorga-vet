import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { apiErrorMessage, isApiErrorCode } from '@/shared/lib/apiClient'
import { textRule } from '@/shared/lib/formRules'
import { FormDialog, FormError, TextField } from '@/shared/ui'
import {
  DUPLICATE_CODE_MESSAGE,
  DUPLICATE_DIAGNOSIS_MESSAGE,
  diagnosisErrors,
} from '../api/diagnosisErrors'
import { useCreateDiagnosis } from '../hooks/useDiagnosisMutations'

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
      setSubmitError(apiErrorMessage(error, 'Could not add the diagnosis.'))
    }
  })

  const keepAsTyped = async () => {
    if (await trigger('name')) onUseWithoutAdding(getValues('name').trim())
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New diagnosis"
      description="The diagnosis is added to the diagnosis list and to this exam."
      formId="create-diagnosis-form"
      submitLabel="Add to diagnosis list"
      isPending={isSubmitting || create.isPending}
      secondaryAction={{ label: 'Use without adding', onClick: () => void keepAsTyped() }}
      onSubmit={submit}
      onOpen={() => {
        reset({ name: initialName, code: '' })
        setSubmitError(undefined)
      }}
    >
      <TextField
        id="new-diagnosis-name"
        label="Name *"
        {...register('name', { validate: textRule(200, 'Name is required') })}
        error={errors.name?.message}
      />
      <TextField
        id="new-diagnosis-code"
        label="Code"
        placeholder="Optional, e.g. D12"
        {...register('code', { validate: textRule(20) })}
        error={errors.code?.message}
      />
      <FormError message={submitError} />
    </FormDialog>
  )
}
