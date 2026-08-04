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
    species: 'pas',
    breed: '',
    sex: 'muzjak',
    allergies: 'nema',
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
      ariaLabel={mode === 'create' ? 'Novi pacijent' : 'Izmena kartona'}
      headerTone="plain"
      header={
        <div>
          <div className={styles.title}>{mode === 'create' ? 'Novi pacijent' : 'Izmena kartona'}</div>
          <div className={styles.subtitle}>
            {mode === 'create'
              ? 'Popunite podatke i sačuvajte.'
              : `${initialPatient?.name} · Rbr ${initialPatient?.cardNumber}`}
          </div>
        </div>
      }
      footer={
        mode === 'create' ? (
          <>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Odustani
            </Button>
            <Button variant="primary" type="submit" form="patient-form" disabled={isSubmitting}>
              Sačuvaj
            </Button>
          </>
        ) : (
          <>
            <Button variant="danger" type="button" onClick={onDelete}>
              Obriši
            </Button>
            <Button variant="primary" type="submit" form="patient-form" disabled={isSubmitting}>
              Sačuvaj izmene
            </Button>
          </>
        )
      }
    >
      <form id="patient-form" onSubmit={submit} className={styles.form}>
        <div className={styles.row}>
          <TextField
            id="cardNumber"
            label="Rbr *"
            {...register('cardNumber', { required: 'Rbr je obavezan' })}
            error={errors.cardNumber?.message}
          />
          <TextField
            id="name"
            label="Ime životinje *"
            {...register('name', { required: 'Ime je obavezno' })}
            error={errors.name?.message}
          />
        </div>

        <TextField
          id="ownerName"
          label="Vlasnik *"
          {...register('ownerName', { required: 'Vlasnik je obavezan' })}
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
                label="Vrsta"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'pas', label: 'Pas' },
                  { value: 'macka', label: 'Mačka' },
                  { value: 'ptica', label: 'Ptica' },
                  { value: 'ostalo', label: 'Ostalo' },
                ]}
              />
            )}
          />
          <TextField id="breed" label="Rasa" {...register('breed')} />
        </div>

        <div className={styles.row}>
          <Controller
            name="sex"
            control={control}
            render={({ field }) => (
              <Select
                id="sex"
                label="Pol"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'muzjak', label: 'Mužjak' },
                  { value: 'zenka', label: 'Ženka' },
                ]}
              />
            )}
          />
          <TextField id="birthDate" label="Datum rođenja" type="date" {...register('birthDate')} />
        </div>

        <div className={styles.row}>
          <TextField
            id="age"
            label="Godine"
            type="number"
            {...register('age', { setValueAs: (value) => (value === '' ? undefined : Number(value)) })}
          />
          <TextField
            id="weightKg"
            label="Težina (kg)"
            type="number"
            step="0.1"
            {...register('weightKg', { setValueAs: (value) => (value === '' ? undefined : Number(value)) })}
          />
        </div>

        <div className={styles.row}>
          <TextField id="color" label="Boja" {...register('color')} />
          <TextField id="chipNumber" label="Čip br." {...register('chipNumber')} />
        </div>

        <div className={styles.row}>
          <TextField id="phone" label="Telefon" {...register('phone')} />
          <TextField id="mobile" label="Mobilni" {...register('mobile')} />
        </div>

        <Controller
          name="allergies"
          control={control}
          render={({ field }) => (
            <Select
              id="allergies"
              label="Alergije"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'nema', label: 'Nema' },
                { value: 'hrana', label: 'Hrana' },
                { value: 'lekovi', label: 'Lekovi' },
                { value: 'buve_krpelji', label: 'Buve/krpelji' },
                { value: 'polen', label: 'Polen' },
                { value: 'ostalo', label: 'Ostalo' },
              ]}
            />
          )}
        />

        <Textarea
          id="anamnesis"
          label="Anamneza"
          placeholder="Istorija bolesti, simptomi, terapija…"
          {...register('anamnesis')}
          className={styles.fullWidth}
        />

        <Textarea
          id="note"
          label="Napomena"
          placeholder="Interna napomena, preporuka…"
          {...register('note')}
          className={styles.fullWidth}
        />

        <div className={styles.row}>
          <TextField id="address" label="Adresa" {...register('address')} />
          <TextField id="city" label="Grad" {...register('city')} />
        </div>
      </form>
    </SlidePanel>
  )
}
