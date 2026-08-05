import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Button, Select, SlidePanel, TextField, Textarea } from '@/shared/ui'
import { generatePatientCardNumber } from '../api/patientsApi'
import type { Patient, PatientInput } from '../types'
import styles from './PatientFormPanel.module.css'

export interface PatientFormPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  initialPatient?: Patient
  onSubmit: (input: PatientInput) => Promise<void>
  onDelete?: () => void
}

function buildDefaultValues(mode: 'create' | 'edit', initialPatient?: Patient): PatientInput {
  if (mode === 'edit' && initialPatient) {
    const {
      cardNumber,
      name,
      species,
      breed,
      sex,
      birthDate,
      age,
      weightKg,
      color,
      chipNumber,
      allergies,
      anamnesis,
      note,
      ownerName,
      phone,
      mobile,
      address,
      city,
      totalServicesRsd,
      paidRsd,
    } = initialPatient
    return {
      cardNumber,
      name,
      species,
      breed,
      sex,
      birthDate,
      age,
      weightKg,
      color,
      chipNumber,
      allergies,
      anamnesis,
      note,
      ownerName,
      phone,
      mobile,
      address,
      city,
      totalServicesRsd,
      paidRsd,
    }
  }
  return {
    cardNumber: generatePatientCardNumber(),
    name: '',
    species: 'dog',
    breed: '',
    sex: 'male',
    allergies: 'none',
    ownerName: '',
    city: '',
  }
}

export function PatientFormPanel({
  open,
  onOpenChange,
  mode,
  initialPatient,
  onSubmit,
  onDelete,
}: PatientFormPanelProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientInput>({ defaultValues: buildDefaultValues(mode, initialPatient) })

  useEffect(() => {
    if (open) {
      reset(buildDefaultValues(mode, initialPatient))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, initialPatient])

  const submit = handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return (
    <SlidePanel
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel={mode === 'create' ? 'New patient' : 'Edit record'}
      headerTone="plain"
      header={
        <div>
          <div className={styles.title}>{mode === 'create' ? 'New patient' : 'Edit record'}</div>
          <div className={styles.subtitle}>
            {mode === 'create'
              ? 'Fill in the details and save.'
              : `${initialPatient?.name} · No. ${initialPatient?.cardNumber}`}
          </div>
        </div>
      }
      footer={
        mode === 'create' ? (
          <>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="patient-form" disabled={isSubmitting}>
              Save
            </Button>
          </>
        ) : (
          <>
            <Button variant="danger" type="button" onClick={onDelete}>
              Delete
            </Button>
            <Button variant="primary" type="submit" form="patient-form" disabled={isSubmitting}>
              Save changes
            </Button>
          </>
        )
      }
    >
      <form id="patient-form" onSubmit={submit} className={styles.form}>
        <div className={styles.row}>
          <TextField
            id="cardNumber"
            label="No. *"
            {...register('cardNumber', { required: 'No. is required' })}
            error={errors.cardNumber?.message}
          />
          <TextField
            id="name"
            label="Animal name *"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />
        </div>

        <TextField
          id="ownerName"
          label="Owner *"
          {...register('ownerName', { required: 'Owner is required' })}
          error={errors.ownerName?.message}
          className={styles.fullWidth}
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
                onChange={field.onChange}
                options={[
                  { value: 'dog', label: 'Dog' },
                  { value: 'cat', label: 'Cat' },
                  { value: 'bird', label: 'Bird' },
                  { value: 'other', label: 'Other' },
                ]}
              />
            )}
          />
          <TextField id="breed" label="Breed" {...register('breed')} />
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
          <TextField id="birthDate" label="Date of birth" type="date" {...register('birthDate')} />
        </div>

        <div className={styles.row}>
          <TextField
            id="age"
            label="Age"
            type="number"
            {...register('age', { setValueAs: (value) => (value === '' ? undefined : Number(value)) })}
          />
          <TextField
            id="weightKg"
            label="Weight (kg)"
            type="number"
            step="0.1"
            {...register('weightKg', { setValueAs: (value) => (value === '' ? undefined : Number(value)) })}
          />
        </div>

        <div className={styles.row}>
          <TextField id="color" label="Color" {...register('color')} />
          <TextField id="chipNumber" label="Chip no." {...register('chipNumber')} />
        </div>

        <div className={styles.row}>
          <TextField id="phone" label="Phone" {...register('phone')} />
          <TextField id="mobile" label="Mobile" {...register('mobile')} />
        </div>

        <Controller
          name="allergies"
          control={control}
          render={({ field }) => (
            <Select
              id="allergies"
              label="Allergies"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'none', label: 'None' },
                { value: 'food', label: 'Food' },
                { value: 'medication', label: 'Medication' },
                { value: 'fleas_ticks', label: 'Fleas/ticks' },
                { value: 'pollen', label: 'Pollen' },
                { value: 'other', label: 'Other' },
              ]}
            />
          )}
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

        <div className={styles.row}>
          <TextField id="address" label="Address" {...register('address')} />
          <TextField id="city" label="City" {...register('city')} />
        </div>
      </form>
    </SlidePanel>
  )
}
