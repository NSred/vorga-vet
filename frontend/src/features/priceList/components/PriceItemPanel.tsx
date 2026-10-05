import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { isApiErrorCode } from '@/shared/lib/apiClient'
import { Badge, Button, FormError, SegmentedControl, SlidePanel, TextField } from '@/shared/ui'
import {
  DUPLICATE_NAME_MESSAGE,
  nameNotUniqueCode,
  notFoundCode,
  priceListErrorMessage,
} from '../api/priceListErrors'
import { useCreatePriceListItem, useUpdatePriceListItem } from '../hooks/usePriceListMutations'
import { priceError } from '../lib/price'
import { emptyFormValues, formValuesOf, toWriteRequest } from '../lib/priceListMapping'
import type { PriceItemFormValues, PriceListItem, PriceListKind } from '../types'
import styles from './PriceItemPanel.module.css'
import { UnitSelect } from './UnitSelect'

export type PriceItemPanelProps = {
  kind: PriceListKind
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (name: string) => void
  onMissing: () => void
} & (
  | { mode: 'create' }
  | {
      mode: 'edit'
      item: PriceListItem
      onRetire: () => void
      onRestore: () => void
      isStatusPending?: boolean
    }
)

type VaccineKind = 'none' | 'regular' | 'rabies'

const VACCINE_KINDS: { value: VaccineKind; label: string }[] = [
  { value: 'none', label: 'Not a vaccine' },
  { value: 'regular', label: 'Vaccine' },
  { value: 'rabies', label: 'Rabies vaccine' },
]

const VACCINE_HINTS: Record<VaccineKind, string> = {
  none: 'Not tracked as a vaccination; giving it creates no reminder.',
  regular:
    'Tracked as a vaccination: giving it on an exam records the dose and reminds when the next one is due.',
  rabies: 'Tracked as a rabies vaccination, with its own reminder and certificate.',
}

const NOUN: Record<PriceListKind, string> = { service: 'service', medication: 'medication' }

export function PriceItemPanel(props: PriceItemPanelProps) {
  const { kind, open, onOpenChange, onSaved, onMissing } = props
  const item = props.mode === 'edit' ? props.item : undefined
  const create = useCreatePriceListItem()
  const update = useUpdatePriceListItem()
  const [submitError, setSubmitError] = useState<string | undefined>(undefined)

  const {
    control,
    register,
    watch,
    setValue,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PriceItemFormValues>({
    defaultValues: item ? formValuesOf(item) : emptyFormValues(),
  })

  useEffect(() => {
    if (open) {
      reset(item ? formValuesOf(item) : emptyFormValues())
      setSubmitError(undefined)
    }
  }, [open, item, reset])

  const submit = handleSubmit(async (values) => {
    setSubmitError(undefined)
    const request = toWriteRequest(kind, values)

    try {
      if (item) {
        await update.mutateAsync({ kind, id: item.id, request })
      } else {
        await create.mutateAsync({ kind, request })
      }
      onSaved(request.name)
    } catch (error: unknown) {
      if (isApiErrorCode(error, nameNotUniqueCode(kind))) {
        setError('name', { message: DUPLICATE_NAME_MESSAGE })
        return
      }
      if (isApiErrorCode(error, notFoundCode(kind))) {
        onMissing()
        return
      }
      setSubmitError(priceListErrorMessage(error, `Could not save the ${NOUN[kind]}.`))
    }
  })

  const isVaccine = watch('isVaccine')
  const isRabies = watch('isRabies')
  const vaccineKind: VaccineKind = !isVaccine ? 'none' : isRabies ? 'rabies' : 'regular'

  const chooseVaccineKind = (next: VaccineKind) => {
    setValue('isVaccine', next !== 'none')
    setValue('isRabies', next === 'rabies')
  }
  const isPending = isSubmitting || create.isPending || update.isPending
  const title = item ? `Edit ${NOUN[kind]}` : `New ${NOUN[kind]}`

  return (
    <SlidePanel
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel={title}
      headerTone="plain"
      header={
        <div className={styles.header}>
          <div className={styles.title}>{title}</div>
          {item && !item.isActive && <Badge tone="neutral">Retired</Badge>}
        </div>
      }
      footer={
        <>
          {props.mode === 'edit' && (
            <div className={styles.statusAction}>
              {props.item.isActive ? (
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
          <Button variant="primary" type="submit" form="price-item-form" disabled={isPending}>
            Save
          </Button>
        </>
      }
    >
      <form id="price-item-form" onSubmit={submit} className={styles.form} noValidate>
        <TextField
          id="price-item-name"
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
                <UnitSelect id="price-item-unit" value={field.value} onChange={field.onChange} />
              )}
            />
          )}
          <TextField
            id="price-item-price"
            label="Price (RSD) *"
            inputMode="decimal"
            placeholder="0,00"
            {...register('price', { validate: (value) => priceError(value) ?? true })}
            error={errors.price?.message}
          />
        </div>

        {kind === 'medication' && (
          <fieldset className={styles.vaccine}>
            <legend className={styles.legend}>Vaccine</legend>
            <SegmentedControl
              value={vaccineKind}
              onChange={chooseVaccineKind}
              options={VACCINE_KINDS}
            />
            <p className={styles.hint}>{VACCINE_HINTS[vaccineKind]}</p>
            {isVaccine && (
              <TextField
                id="price-item-validity"
                label="Lasts (days) *"
                inputMode="numeric"
                className={styles.validity}
                {...register('validityDays', {
                  validate: (value) => {
                    const days = Number(value.trim())
                    return (
                      (Number.isInteger(days) && days >= 1 && days <= 3650) ||
                      'Enter 1 to 3650 days'
                    )
                  },
                })}
                error={errors.validityDays?.message}
              />
            )}
          </fieldset>
        )}

        <FormError message={submitError} />
      </form>
    </SlidePanel>
  )
}
