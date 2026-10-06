import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FormDialog, FormError, TextField } from '@/shared/ui'
import { createOwner } from '../../api/ownersApi'
import type { CreateOwnerRequest, OwnerOption } from '../../types'

export interface CreateOwnerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (owner: OwnerOption) => void
}

export function CreateOwnerDialog({ open, onOpenChange, onCreated }: CreateOwnerDialogProps) {
  const [submitError, setSubmitError] = useState<string | undefined>(undefined)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateOwnerRequest>()

  const submit = handleSubmit(async (values) => {
    setSubmitError(undefined)
    try {
      const id = await createOwner(values)
      onCreated({
        id,
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber: values.phoneNumber,
      })
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : 'Could not create the owner.')
    }
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New owner"
      description="The owner is saved immediately and selected for this patient."
      formId="create-owner-form"
      submitLabel="Create owner"
      isPending={isSubmitting}
      onSubmit={submit}
      onOpen={() => {
        reset({ firstName: '', lastName: '', phoneNumber: '', address: '', city: '' })
        setSubmitError(undefined)
      }}
    >
      <TextField
        id="owner-first-name"
        label="First name *"
        {...register('firstName', {
          required: 'First name is required',
          maxLength: { value: 100, message: 'Maximum 100 characters' },
        })}
        error={errors.firstName?.message}
      />
      <TextField
        id="owner-last-name"
        label="Last name *"
        {...register('lastName', {
          required: 'Last name is required',
          maxLength: { value: 100, message: 'Maximum 100 characters' },
        })}
        error={errors.lastName?.message}
      />
      <TextField
        id="owner-phone"
        label="Phone *"
        {...register('phoneNumber', {
          required: 'Phone is required',
          maxLength: { value: 30, message: 'Maximum 30 characters' },
        })}
        error={errors.phoneNumber?.message}
      />
      <TextField
        id="owner-address"
        label="Address *"
        {...register('address', {
          required: 'Address is required',
          maxLength: { value: 200, message: 'Maximum 200 characters' },
        })}
        error={errors.address?.message}
      />
      <TextField
        id="owner-city"
        label="City *"
        {...register('city', {
          required: 'City is required',
          maxLength: { value: 100, message: 'Maximum 100 characters' },
        })}
        error={errors.city?.message}
      />
      <FormError message={submitError} />
    </FormDialog>
  )
}
