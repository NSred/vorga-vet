import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { apiErrorMessage, isApiErrorCode } from '@/shared/lib/apiClient'
import { clinicToday } from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { textRule } from '@/shared/lib/formRules'
import {
  Checkbox,
  DatePicker,
  fieldStyles,
  FormDialog,
  FormError,
  layout,
  SegmentedControl,
  TextField,
} from '@/shared/ui'
import { microchipErrors } from '../api/microchipErrors'
import { useLastClinic, useRegisterMicrochip } from '../hooks/useMicrochips'
import { jmbgError } from '../lib/jmbg'
import { STERILISED_LABELS } from '../lib/registrationLabels'
import type { LastRabies, MicrochipRegistration, RegistrationSubject, Sterilised } from '../types'
import styles from './MicrochipForms.module.css'

export interface RegisterMicrochipDialogProps {
  patientId: string
  chipNumber: string
  subject: RegistrationSubject
  lastRabies?: LastRabies
  defaultVetName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onRegistered: (registration: MicrochipRegistration, jmbg: string) => void
}

interface Values {
  implantedOn: string
  sterilised: Sterilised
  consent: boolean
  clinic: string
  vetName: string
  jmbg: string
}

const DEFAULT_CLINIC = 'VorgaVet'
const STERILISED_OPTIONS = (['yes', 'no', 'unknown'] as const).map((value) => ({
  value,
  label: STERILISED_LABELS[value],
}))

function blank(vetName: string): Values {
  return {
    implantedOn: clinicToday(),
    sterilised: 'unknown',
    consent: false,
    clinic: DEFAULT_CLINIC,
    vetName,
    jmbg: '',
  }
}

export function RegisterMicrochipDialog({
  patientId,
  chipNumber,
  subject,
  lastRabies,
  defaultVetName,
  open,
  onOpenChange,
  onRegistered,
}: RegisterMicrochipDialogProps) {
  const registration = useRegisterMicrochip()
  const remembered = useLastClinic(open)
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<Values>({ defaultValues: blank(defaultVetName) })

  useEffect(() => {
    if (open && remembered.data?.clinic) setValue('clinic', remembered.data.clinic)
  }, [open, remembered.data, setValue])

  const submit = handleSubmit((values) => {
    const ownerJmbg = values.jmbg.trim()
    registration.mutate(
      {
        patientId,
        request: {
          chipNumber,
          implantedOn: values.implantedOn,
          sterilised: values.sterilised,
          consentToPublish: values.consent,
          animal: subject.animal,
          owner: subject.owner,
          lastRabies: lastRabies ?? null,
          clinic: values.clinic.trim(),
          vetName: values.vetName.trim(),
        },
      },
      {
        onSuccess: (saved) => onRegistered(saved, ownerJmbg),
        onError: (error) =>
          setError('root', {
            message: isApiErrorCode(error, microchipErrors.alreadyRegistered)
              ? 'This chip number is already registered'
              : apiErrorMessage(error, 'Could not register the microchip.'),
          }),
      },
    )
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Register microchip"
      description={`${subject.animal.name} · chip ${chipNumber} · owner ${subject.owner.name}`}
      formId="register-microchip-form"
      submitLabel="Register and print"
      isPending={registration.isPending}
      onSubmit={submit}
      onOpen={() => reset(blank(defaultVetName))}
    >
      <div className={styles.row}>
        <Controller
          name="implantedOn"
          control={control}
          rules={{ required: 'Pick the implant date' }}
          render={({ field }) => (
            <DatePicker
              id="chip-implanted-on"
              label="Implanted on *"
              value={field.value}
              maxDate={clinicToday()}
              onChange={field.onChange}
              error={errors.implantedOn?.message}
            />
          )}
        />
        <div className={fieldStyles.field}>
          <span className={fieldStyles.label}>Sterilised</span>
          <Controller
            name="sterilised"
            control={control}
            render={({ field }) => (
              <SegmentedControl
                value={field.value}
                onChange={field.onChange}
                options={STERILISED_OPTIONS}
              />
            )}
          />
        </div>
      </div>
      <p className={layout.note}>
        Last rabies vaccination:{' '}
        {lastRabies
          ? `${lastRabies.vaccineName}, ${formatDisplayDate(lastRabies.givenOn)}`
          : 'none recorded'}
      </p>
      <Controller
        name="consent"
        control={control}
        render={({ field }) => (
          <Checkbox checked={field.value} onChange={field.onChange}>
            The owner consents to publishing the data online
          </Checkbox>
        )}
      />
      <div className={styles.row}>
        <TextField
          id="chip-clinic"
          label="Clinic *"
          {...register('clinic', { validate: textRule(200, 'Name the clinic') })}
          error={errors.clinic?.message}
        />
        <TextField
          id="chip-vet"
          label="Vet *"
          {...register('vetName', { validate: textRule(200, 'Name the vet') })}
          error={errors.vetName?.message}
        />
      </div>
      <TextField
        id="chip-jmbg"
        label="Owner’s JMBG *"
        inputMode="numeric"
        autoComplete="off"
        {...register('jmbg', { validate: (value) => jmbgError(value) ?? true })}
        error={errors.jmbg?.message}
      />
      <p className={layout.note}>The JMBG is printed on the sheet and never saved.</p>
      <FormError message={errors.root?.message} />
    </FormDialog>
  )
}
