import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Modal, TextField } from '@/shared/ui'
import { createBreed } from '../../api/breedsApi'
import type { BreedOption, Species } from '../../types'

const SPECIES_LABEL: Record<Species, string> = {
  dog: 'Dog',
  cat: 'Cat',
  bird: 'Bird',
  other: 'Other',
}

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

  useEffect(() => {
    if (open) {
      reset({ name: initialName })
      setSubmitError(undefined)
    }
  }, [open, initialName, reset])

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
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New breed"
      description={`The breed is saved under species ${SPECIES_LABEL[species]}.`}
      footer={
        <>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="create-breed-form" disabled={isSubmitting}>
            Create breed
          </Button>
        </>
      }
    >
      <form
        id="create-breed-form"
        onSubmit={(event) => {
          event.stopPropagation()
          void submit(event)
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
        {submitError && <p role="alert">{submitError}</p>}
      </form>
    </Modal>
  )
}
