import { useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { apiErrorMessage } from '@/shared/lib/apiClient'
import { addClinicDays, clinicToday } from '@/shared/lib/clinicTime'
import { textRule } from '@/shared/lib/formRules'
import { Checkbox, DatePicker, FormDialog, FormError, layout, TextField } from '@/shared/ui'
import { useAddVaccination } from '../hooks/useVaccinationMutations'

export interface AddVaccinationDialogProps {
  patientId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded: (vaccineName: string) => void
}

interface Values {
  vaccineName: string
  isRabies: boolean
  batch: string
  givenOn: string
  dueOn: string
}

const DEFAULT_VALIDITY_DAYS = 365

function blank(): Values {
  const today = clinicToday()
  return {
    vaccineName: '',
    isRabies: false,
    batch: '',
    givenOn: today,
    dueOn: addClinicDays(today, DEFAULT_VALIDITY_DAYS),
  }
}

export function AddVaccinationDialog({
  patientId,
  open,
  onOpenChange,
  onAdded,
}: AddVaccinationDialogProps) {
  const add = useAddVaccination()
  const dueTouched = useRef(false)
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Values>({ defaultValues: blank() })
  const givenOn = watch('givenOn')

  const submit = handleSubmit((values) => {
    const vaccineName = values.vaccineName.trim()
    add.mutate(
      {
        patientId,
        request: {
          vaccineName,
          isRabies: values.isRabies,
          batch: values.batch.trim() || null,
          givenOn: values.givenOn,
          dueOn: values.dueOn,
        },
      },
      {
        onSuccess: () => onAdded(vaccineName),
        onError: (error) =>
          setError('root', { message: apiErrorMessage(error, 'Could not add the vaccination.') }),
      },
    )
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add a vaccination"
      description="For a vaccine given elsewhere or before VorgaVet. Vaccines given here are recorded from the exam."
      formId="add-vaccination-form"
      submitLabel="Add vaccination"
      isPending={add.isPending}
      onSubmit={submit}
      onOpen={() => {
        reset(blank())
        dueTouched.current = false
      }}
    >
      <TextField
        id="manual-vaccine-name"
        label="Vaccine *"
        placeholder="Nobivac Rabies"
        {...register('vaccineName', { validate: textRule(200, 'Name the vaccine') })}
        error={errors.vaccineName?.message}
      />
      <Controller
        name="isRabies"
        control={control}
        render={({ field }) => (
          <Checkbox checked={field.value} onChange={field.onChange}>
            Rabies vaccine
          </Checkbox>
        )}
      />
      <div className={layout.formRow}>
        <Controller
          name="givenOn"
          control={control}
          rules={{ required: 'Pick the date it was given' }}
          render={({ field }) => (
            <DatePicker
              id="manual-vaccine-given"
              label="Given on *"
              value={field.value}
              maxDate={clinicToday()}
              onChange={(next) => {
                field.onChange(next)
                if (!dueTouched.current && next) {
                  setValue('dueOn', addClinicDays(next, DEFAULT_VALIDITY_DAYS))
                }
              }}
              error={errors.givenOn?.message}
            />
          )}
        />
        <Controller
          name="dueOn"
          control={control}
          rules={{
            required: 'Pick the next due date',
            validate: (dueOn, values) =>
              !values.givenOn || dueOn > values.givenOn || 'The next dose must come after this one',
          }}
          render={({ field }) => (
            <DatePicker
              id="manual-vaccine-due"
              label="Next due *"
              value={field.value}
              minDate={givenOn ? addClinicDays(givenOn, 1) : undefined}
              onChange={(next) => {
                dueTouched.current = true
                field.onChange(next)
              }}
              error={errors.dueOn?.message}
            />
          )}
        />
      </div>
      <TextField
        id="manual-vaccine-batch"
        label="Batch"
        {...register('batch', { validate: textRule(50) })}
        error={errors.batch?.message}
      />
      <FormError message={errors.root?.message} />
    </FormDialog>
  )
}
