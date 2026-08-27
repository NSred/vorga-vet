import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ApiError } from '@/shared/lib/apiClient'
import { todayIso } from '@/shared/lib/dateOnly'
import { Button, DatePicker, Select, SlidePanel, TextField, Textarea } from '@/shared/ui'
import { createPatient, updatePatient } from '../api/patientsApi'
import { generatePatientCardNumber } from '../lib/cardNumber'
import { splitOwnerName } from '../lib/ownerName'
import { toPatientWriteRequest } from '../lib/patientRequest'
import type { PatientDetail, PatientFormValues, Species } from '../types'
import { AllergenPicker } from './pickers/AllergenPicker'
import { BreedPicker } from './pickers/BreedPicker'
import { OwnerPicker } from './pickers/OwnerPicker'
import styles from './PatientFormPanel.module.css'

const CARD_NUMBER_TAKEN = 'Patients.CardNumberNotUnique'
const PATIENT_MISSING = 'Patients.NotFound'
const DISCARD_PROMPT = 'You have unsaved changes. Discard them?'

export interface PatientFormPanelProps {
  mode: 'create' | 'edit'
  patient?: PatientDetail
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (patientName: string) => void
  onMissing: () => void
}

function buildDefaults(patient?: PatientDetail): PatientFormValues {
  if (!patient) {
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

  const { firstName, lastName } = splitOwnerName(patient.ownerName)

  return {
    cardNumber: patient.cardNumber,
    name: patient.name,
    species: patient.species,
    owner: { id: patient.ownerId, firstName, lastName, phoneNumber: patient.phoneNumber },
    breed: { id: patient.breedId, name: patient.breedName },
    sex: patient.sex,
    birthDate: patient.birthDate,
    weightKg: patient.weightKg,
    color: patient.color,
    chipNumber: patient.chipNumber,
    allergens: patient.allergies,
    anamnesis: patient.anamnesis,
    note: patient.note,
  }
}

export function PatientFormPanel({
  mode,
  patient,
  open,
  onOpenChange,
  onSaved,
  onMissing,
}: PatientFormPanelProps) {
  const [submitError, setSubmitError] = useState<string | undefined>(undefined)
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<PatientFormValues>({ defaultValues: buildDefaults(patient) })

  const species = watch('species')
  const previousSpecies = useRef(species)
  const cardNumberEdited = useRef(false)

  useEffect(() => {
    if (open) {
      const defaults = buildDefaults(patient)
      reset(defaults)
      previousSpecies.current = defaults.species
      cardNumberEdited.current = false
      setSubmitError(undefined)
    }
  }, [open, patient, reset])

  useEffect(() => {
    if (previousSpecies.current === species) return
    previousSpecies.current = species

    if (mode === 'create' && !cardNumberEdited.current) {
      setValue('cardNumber', generatePatientCardNumber(species))
    }
  }, [mode, species, setValue])

  const cardNumberField = register('cardNumber', {
    required: 'No. is required',
    maxLength: { value: 20, message: 'Maximum 20 characters' },
  })

  function requestClose() {
    if (mode === 'edit' && isDirty && !window.confirm(DISCARD_PROMPT)) {
      return
    }
    onOpenChange(false)
  }

  function handleFailure(error: unknown) {
    if (error instanceof ApiError && error.code === CARD_NUMBER_TAKEN) {
      setError(
        'cardNumber',
        { message: 'This card number is already taken. Try another.' },
        { shouldFocus: true },
      )
      return
    }

    if (error instanceof ApiError && error.code === PATIENT_MISSING) {
      onMissing()
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
    const request = toPatientWriteRequest(values)

    if (mode === 'edit' && patient) {
      try {
        await updatePatient(patient.id, request)
        onSaved(values.name.trim())
      } catch (error: unknown) {
        handleFailure(error)
      }
      return
    }

    try {
      await createPatient(request)
      onSaved(values.name.trim())
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
        await createPatient(toPatientWriteRequest({ ...values, cardNumber: retryCardNumber }))
        onSaved(values.name.trim())
      } catch (retryError: unknown) {
        handleFailure(retryError)
      }
    }
  })

  const isEdit = mode === 'edit'

  return (
    <SlidePanel
      open={open}
      onOpenChange={(next) => !next && requestClose()}
      ariaLabel={isEdit ? `Edit ${patient?.name ?? 'patient'}` : 'New patient'}
      headerTone="plain"
      header={
        <div>
          <div className={styles.title}>
            {isEdit ? `Edit ${patient?.name ?? 'patient'}` : 'New patient'}
          </div>
          <div className={styles.subtitle}>
            {isEdit ? 'Update the details and save.' : 'Fill in the details and save.'}
          </div>
        </div>
      }
      footer={
        <>
          <Button variant="outline" type="button" onClick={requestClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="patient-form"
            disabled={isSubmitting}
          >
            Save
          </Button>
        </>
      }
    >
      <form id="patient-form" onSubmit={submit} className={styles.form}>
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
                !value || value <= todayIso() ? true : 'Date of birth cannot be in the future',
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
