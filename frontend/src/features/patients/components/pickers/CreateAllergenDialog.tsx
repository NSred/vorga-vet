import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button, Modal, TextField } from '@/shared/ui'
import { createAllergen } from '../../api/allergensApi'
import type { AllergenOption } from '../../types'

interface CreateAllergenFormValues {
  name: string
}

export interface CreateAllergenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialName: string
  onCreated: (allergen: AllergenOption) => void
}

export function CreateAllergenDialog({
  open,
  onOpenChange,
  initialName,
  onCreated,
}: CreateAllergenDialogProps) {
  const [submitError, setSubmitError] = useState<string | undefined>(undefined)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAllergenFormValues>()

  useEffect(() => {
    if (open) {
      reset({ name: initialName })
      setSubmitError(undefined)
    }
  }, [open, initialName, reset])

  const submit = handleSubmit(async (values) => {
    setSubmitError(undefined)
    try {
      const id = await createAllergen({ name: values.name })
      onCreated({ id, name: values.name })
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : 'Could not create the allergen.')
    }
  })

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New allergen"
      description="An allergen with the same name is reused rather than duplicated."
      footer={
        <>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="create-allergen-form"
            disabled={isSubmitting}
          >
            Create allergen
          </Button>
        </>
      }
    >
      <form
        id="create-allergen-form"
        onSubmit={(event) => {
          event.stopPropagation()
          void submit(event)
        }}
      >
        <TextField
          id="allergen-name"
          label="Allergen name *"
          {...register('name', {
            required: 'Allergen name is required',
            maxLength: { value: 100, message: 'Maximum 100 characters' },
          })}
          error={errors.name?.message}
        />
        {submitError && <p role="alert">{submitError}</p>}
      </form>
    </Modal>
  )
}
