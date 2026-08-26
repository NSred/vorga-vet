import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ApiError } from '@/shared/lib/apiClient'
import { todayIso } from '@/shared/lib/dateOnly'
import { Button, DatePicker, Select, SlidePanel, TextField, Textarea } from '@/shared/ui'
import { createPatient } from '../api/patientsApi'
import { generatePatientCardNumber } from '../lib/cardNumber'
import { toCreatePatientRequest } from '../lib/patientRequest'
import type { PatientFormValues, Species } from '../types'
import { AllergenPicker } from './pickers/AllergenPicker'
import { BreedPicker } from './pickers/BreedPicker'
import { OwnerPicker } from './pickers/OwnerPicker'
import styles from './PatientCreatePanel.module.css'

const CARD_NUMBER_TAKEN = 'Patients.CardNumberNotUnique'

export interface PatientCreatePanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (patientName: string) => void
}

function buildDefaults(): PatientFormValues {
  return {
    cardNumber: generatePatientCardNumber('dog'),
    name: '',
    species: 'dog',
    owner: null,
    breed: null,
    sex: 'male',
    allergens: [],
  }
}

export function PatientCreatePanel({ open, onOpenChange, onCreated }: PatientCreatePanelProps) {
  const [submitError, setSubmitError] = useState<string | undefined>(undefined)
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormValues>({ defaultValues: buildDefaults() })

  const species = watch('species')
  const previousSpecies = useRef(species)
  const cardNumberEdited = useRef(false)

  useEffect(() => {
    if (open) {
      const defaults = buildDefaults()
      reset(defaults)
      previousSpecies.current = defaults.species
      cardNumberEdited.current = false
      setSubmitError(undefined)
    }
  }, [open, reset])

  useEffect(() => {
    if (previousSpecies.current === species) return
    previousSpecies.current = species

    if (!cardNumberEdited.current) {
      setValue('cardNumber', generatePatientCardNumber(species))
    }
  }, [species, setValue])

  const cardNumberField = register('cardNumber', {
    required: 'No. is required',
    maxLength: { value: 20, message: 'Maximum 20 characters' },
  })

  function handleFailure(error: unknown) {
    if (error instanceof ApiError && error.code === CARD_NUMBER_TAKEN) {
      setError('cardNumber', { message: 'This card number is already taken. Try another.' })
      return
    }

    if (error instanceof ApiError && error.status === 404) {
      if (error.code === 'Owners.NotFound') {
        setValue('owner', null)
        setSubmitError('That owner no longer exists. Please select another.')
        return
      }
      if (error.code === 'Breeds.NotFound') {
        setValue('breed', null)
        setSubmitError('That breed no longer exists. Please select another.')
        return
      }
      if (error.code === 'Allergens.NotFound') {
        setValue('allergens', [])
        setSubmitError('One of the allergens no longer exists. Please select them again.')
        return
      }
    }

    if (error instanceof ApiError && error.validationMessages) {
      setSubmitError(error.validationMessages.join(' '))
      return
    }

    setSubmitError(error instanceof Error ? error.message : 'Could not save the patient.')
  }

  const submit = handleSubmit(async (values) => {
    setSubmitError(undefined)

    try {
      await createPatient(toCreatePatientRequest(values))
      onCreated(values.name.trim())
      return
    } catch (error: unknown) {
      const isTaken = error instanceof ApiError && error.code === CARD_NUMBER_TAKEN

      if (!isTaken || cardNumberEdited.current) {
        handleFailure(error)
        return
      }

      const retryCardNumber = generatePatientCardNumber(values.species)
      setValue('cardNumber', retryCardNumber)

      try {
        await createPatient(toCreatePatientRequest({ ...values, cardNumber: retryCardNumber }))
        onCreated(values.name.trim())
      } catch (retryError: unknown) {
        handleFailure(retryError)
      }
    }
  })

  return (
    <SlidePanel
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel="New patient"
      headerTone="plain"
      header={
        <div>
          <div className={styles.title}>New patient</div>
          <div className={styles.subtitle}>Fill in the details and save.</div>
        </div>
      }
      footer={
        <>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="patient-create-form"
            disabled={isSubmitting}
          >
            Save
          </Button>
        </>
      }
    >
      <form id="patient-create-form" onSubmit={submit} className={styles.form}>
        <div className={styles.row}>
          <TextField
            id="cardNumber"
            label="No. *"
            {...cardNumberField}
            onChange={(event) => {
              cardNumberEdited.current = true
              return cardNumberField.onChange(event)
            }}
            error={errors.cardNumber?.message}
          />
          <TextField
            id="name"
            label="Animal name *"
            {...register('name', {
              required: 'Name is required',
              maxLength: { value: 100, message: 'Maximum 100 characters' },
            })}
            error={errors.name?.message}
          />
        </div>

        <Controller
          name="owner"
          control={control}
          rules={{ required: 'Owner is required' }}
          render={({ field }) => (
            <OwnerPicker
              value={field.value}
              onChange={field.onChange}
              error={errors.owner?.message}
            />
          )}
        />

        <div className={styles.row}>
          <Controller
            name="species"
            control={control}
            render={({ field }) => (
              <Select
                id="species"
                label="Species"
                value={field.value}
                onChange={(value) => field.onChange(value as Species)}
                options={[
                  { value: 'dog', label: 'Dog' },
                  { value: 'cat', label: 'Cat' },
                  { value: 'bird', label: 'Bird' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            )}
          />
          <Controller
            name="breed"
            control={control}
            rules={{ required: 'Breed is required' }}
            render={({ field }) => (
              <BreedPicker
                species={species}
                value={field.value}
                onChange={field.onChange}
                error={errors.breed?.message}
              />
            )}
          />
        </div>

        <div className={styles.row}>
          <Controller
            name="sex"
            control={control}
            render={({ field }) => (
              <Select
                id="sex"
                label="Sex"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                ]}
              />
            )}
          />
          <Controller
            name="birthDate"
            control={control}
            rules={{
              validate: (value) =>
                !value || value <= new Date().toISOString().slice(0, 10)
                  ? true
                  : 'Date of birth cannot be in the future',
            }}
            render={({ field }) => (
              <DatePicker
                id="birthDate"
                label="Date of birth"
                value={field.value}
                onChange={field.onChange}
                maxDate={todayIso()}
                error={errors.birthDate?.message}
              />
            )}
          />
        </div>

        <div className={styles.row}>
          <TextField
            id="weightKg"
            label="Weight (kg)"
            type="number"
            step="0.1"
            {...register('weightKg', {
              setValueAs: (value) => (value === '' ? undefined : Number(value)),
              min: { value: 0.01, message: 'Weight must be greater than 0' },
            })}
            error={errors.weightKg?.message}
          />
          <TextField id="color" label="Color" {...register('color')} />
        </div>

        <TextField id="chipNumber" label="Chip no." {...register('chipNumber')} />

        <Controller
          name="allergens"
          control={control}
          render={({ field }) => <AllergenPicker value={field.value} onChange={field.onChange} />}
        />

        <Textarea
          id="anamnesis"
          label="Medical history"
          placeholder="Medical history, symptoms, treatment…"
          {...register('anamnesis')}
          className={styles.fullWidth}
        />

        <Textarea
          id="note"
          label="Note"
          placeholder="Internal note, recommendation…"
          {...register('note')}
          className={styles.fullWidth}
        />

        {submitError && (
          <p role="alert" className={styles.submitError}>
            {submitError}
          </p>
        )}
      </form>
    </SlidePanel>
  )
}
