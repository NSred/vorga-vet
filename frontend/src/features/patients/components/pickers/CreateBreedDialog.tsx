import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { SPECIES_LABELS } from '@/shared/domain/species'
import { FormDialog, FormError, TextField } from '@/shared/ui'
import { createBreed } from '../../api/breedsApi'
import type { BreedOption, Species } from '../../types'

interface CreateBreedFormValues {
  name: string
}

export interface CreateBreedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  species: Species
  initialName: string
  onCreated: (breed: BreedOption) => void
}

export function CreateBreedDialog({
  open,
  onOpenChange,
  species,
  initialName,
  onCreated,
}: CreateBreedDialogProps) {
  const [submitError, setSubmitError] = useState<string | undefined>(undefined)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateBreedFormValues>()

  const submit = handleSubmit(async (values) => {
    setSubmitError(undefined)
    try {
      const id = await createBreed({ name: values.name, species })
      onCreated({ id, name: values.name })
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : 'Could not create the breed.')
    }
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New breed"
      description={`The breed is saved under species ${SPECIES_LABELS[species]}.`}
      formId="create-breed-form"
      submitLabel="Create breed"
      isPending={isSubmitting}
      onSubmit={submit}
      onOpen={() => {
        reset({ name: initialName })
        setSubmitError(undefined)
      }}
    >
      <TextField
        id="breed-name"
        label="Breed name *"
        {...register('name', {
          required: 'Breed name is required',
          maxLength: { value: 100, message: 'Maximum 100 characters' },
        })}
        error={errors.name?.message}
      />
      <FormError message={submitError} />
    </FormDialog>
  )
}
