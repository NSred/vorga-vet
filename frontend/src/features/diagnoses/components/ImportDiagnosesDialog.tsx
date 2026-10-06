import { useForm } from 'react-hook-form'
import { apiErrorMessage } from '@/shared/lib/apiClient'
import { FormDialog, Textarea } from '@/shared/ui'
import { useImportDiagnoses } from '../hooks/useDiagnosisMutations'
import { splitPastedNames } from '../lib/diagnosisMapping'
import type { DiagnosisImportResult } from '../types'

export interface ImportDiagnosesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: (result: DiagnosisImportResult) => void
}

export function ImportDiagnosesDialog({
  open,
  onOpenChange,
  onImported,
}: ImportDiagnosesDialogProps) {
  const importNames = useImportDiagnoses()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors },
  } = useForm<{ text: string }>({ defaultValues: { text: '' } })

  const count = splitPastedNames(watch('text')).length

  const submit = handleSubmit(({ text }) =>
    importNames.mutate(splitPastedNames(text), {
      onSuccess: onImported,
      onError: (failure) =>
        setError('text', { message: apiErrorMessage(failure, 'Could not add the diagnoses.') }),
    }),
  )

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Paste a list of diagnoses"
      description="One diagnosis per line. Names already on the list, retired ones included, are skipped."
      formId="import-diagnoses-form"
      submitLabel={count > 0 ? `Add ${count}` : 'Add'}
      isPending={importNames.isPending}
      onSubmit={submit}
      onOpen={() => reset({ text: '' })}
    >
      <Textarea
        id="diagnoses-paste"
        label="Diagnoses"
        placeholder={'Otitis media\nRhinitis acuta\nFractura femoris'}
        rows={10}
        {...register('text', {
          validate: (text) => splitPastedNames(text).length > 0 || 'Paste at least one diagnosis',
        })}
        error={errors.text?.message}
      />
    </FormDialog>
  )
}
