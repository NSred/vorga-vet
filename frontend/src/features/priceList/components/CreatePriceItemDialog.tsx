import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { isApiErrorCode } from '@/shared/lib/apiClient'
import { Button, FormError, Modal, TextField } from '@/shared/ui'
import {
  DUPLICATE_NAME_MESSAGE,
  nameNotUniqueCode,
  priceListErrorMessage,
} from '../api/priceListErrors'
import { useCreatePriceListItem } from '../hooks/usePriceListMutations'
import { priceError } from '../lib/price'
import { toWriteRequest } from '../lib/priceListMapping'
import type { PriceItemFormValues, PriceListItem, PriceListKind } from '../types'
import styles from './CreatePriceItemDialog.module.css'
import { UnitSelect } from './UnitSelect'

export interface CreatePriceItemDialogProps {
  kind: PriceListKind
  open: boolean
  onOpenChange: (open: boolean) => void
  initialName: string
  onCreated: (item: PriceListItem) => void
}

const COPY: Record<PriceListKind, { title: string; noun: string }> = {
  service: { title: 'New service', noun: 'service' },
  medication: { title: 'New medication', noun: 'medication' },
}

export function CreatePriceItemDialog({
  kind,
  open,
  onOpenChange,
  initialName,
  onCreated,
}: CreatePriceItemDialogProps) {
  const create = useCreatePriceListItem()
  const [submitError, setSubmitError] = useState<string | undefined>(undefined)
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PriceItemFormValues>()

  useEffect(() => {
    if (open) {
      reset({ name: initialName, price: '', unit: '' })
      setSubmitError(undefined)
    }
  }, [open, initialName, reset])

  const submit = handleSubmit(async (values) => {
    setSubmitError(undefined)
    const request = toWriteRequest(kind, values)

    try {
      const id = await create.mutateAsync({ kind, request })
      const item: PriceListItem = {
        id,
        kind,
        name: request.name,
        price: request.price,
        isActive: true,
      }
      if (request.unit) item.unit = request.unit
      onCreated(item)
    } catch (error: unknown) {
      if (isApiErrorCode(error, nameNotUniqueCode(kind))) {
        setError('name', { message: DUPLICATE_NAME_MESSAGE })
        return
      }
      setSubmitError(priceListErrorMessage(error, `Could not create the ${COPY[kind].noun}.`))
    }
  })

  const formId = `create-${kind}-form`

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={COPY[kind].title}
      description={`The ${COPY[kind].noun} is added to the price list and to this exam.`}
      footer={
        <>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form={formId}
            disabled={isSubmitting || create.isPending}
          >
            Add to price list
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.stopPropagation()
          void submit(event)
        }}
      >
        <TextField
          id={`new-${kind}-name`}
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
        <div className={kind === 'medication' ? styles.row : undefined}>
          {kind === 'medication' && (
            <Controller
              name="unit"
              control={control}
              render={({ field }) => (
                <UnitSelect
                  id="new-medication-unit"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          )}
          <TextField
            id={`new-${kind}-price`}
            label="Price (RSD) *"
            inputMode="decimal"
            placeholder="0,00"
            {...register('price', { validate: (value) => priceError(value) ?? true })}
            error={errors.price?.message}
          />
        </div>
        <FormError message={submitError} />
      </form>
    </Modal>
  )
}
