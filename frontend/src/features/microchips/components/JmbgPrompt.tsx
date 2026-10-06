import { useForm } from 'react-hook-form'
import { FormDialog, TextField } from '@/shared/ui'
import { jmbgError } from '../lib/jmbg'

export interface JmbgPromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (jmbg: string) => void
}

export function JmbgPrompt({ open, onOpenChange, onConfirm }: JmbgPromptProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ jmbg: string }>({ defaultValues: { jmbg: '' } })

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Print registration sheet"
      description="The owner’s JMBG is printed but never saved, so it is asked for every time."
      formId="reprint-jmbg-form"
      submitLabel="Print"
      onSubmit={handleSubmit(({ jmbg }) => onConfirm(jmbg.trim()))}
      onOpen={() => reset({ jmbg: '' })}
    >
      <TextField
        id="reprint-jmbg"
        label="Owner’s JMBG *"
        inputMode="numeric"
        autoComplete="off"
        {...register('jmbg', { validate: (value) => jmbgError(value) ?? true })}
        error={errors.jmbg?.message}
      />
    </FormDialog>
  )
}
