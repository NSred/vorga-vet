import { useEffect } from 'react'
import { Controller, useForm, type RegisterOptions } from 'react-hook-form'
import { apiErrorMessage, isApiErrorCode } from '@/shared/lib/apiClient'
import { clinicToday } from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { textRule } from '@/shared/lib/formRules'
import { DatePicker, FormDialog, FormError, layout, TextField } from '@/shared/ui'
import { vaccinationErrors } from '../api/vaccinationErrors'
import { useIssueCertificate, useLastIssuer } from '../hooks/useCertificates'
import type { CertificateSubject, RabiesCertificate, Vaccination } from '../types'

export interface IssueCertificateDialogProps {
  vaccination: Vaccination
  subject: CertificateSubject
  defaultVetName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onIssued: (certificate: RabiesCertificate) => void
  print?: boolean
}

interface Values {
  number: string
  issuedOn: string
  passportNumber: string
  passportIssuedOn: string
  chipImplantedOn: string
  issuedBy: string
  vetName: string
  vetLicence: string
}

const DEFAULT_ISSUER = 'VorgaVet'

function blank(vetName: string): Values {
  return {
    number: '',
    issuedOn: clinicToday(),
    passportNumber: '',
    passportIssuedOn: '',
    chipImplantedOn: '',
    issuedBy: DEFAULT_ISSUER,
    vetName,
    vetLicence: '',
  }
}

export function IssueCertificateDialog({
  vaccination,
  subject,
  defaultVetName,
  open,
  onOpenChange,
  onIssued,
  print = true,
}: IssueCertificateDialogProps) {
  const issue = useIssueCertificate()
  const lastIssuer = useLastIssuer(open)
  const today = clinicToday()
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
    const remembered = lastIssuer.data
    if (!open || !remembered) return
    if (remembered.issuedBy) setValue('issuedBy', remembered.issuedBy)
    if (remembered.vetLicence) setValue('vetLicence', remembered.vetLicence)
  }, [open, lastIssuer.data, setValue])

  const submit = handleSubmit((values) =>
    issue.mutate(
      {
        vaccinationId: vaccination.id,
        request: {
          number: values.number.trim(),
          issuedOn: values.issuedOn,
          animal: subject.animal,
          owner: subject.owner,
          passportNumber: values.passportNumber.trim() || null,
          passportIssuedOn: values.passportIssuedOn || null,
          chipImplantedOn: values.chipImplantedOn || null,
          issuedBy: values.issuedBy.trim(),
          vetName: values.vetName.trim(),
          vetLicence: values.vetLicence.trim() || null,
        },
      },
      {
        onSuccess: onIssued,
        onError: (error) => {
          if (isApiErrorCode(error, vaccinationErrors.certificateNumberNotUnique)) {
            setError('number', { message: 'This number was already used on another certificate' })
            return
          }
          setError('root', {
            message: apiErrorMessage(error, 'Could not issue the certificate.'),
          })
        },
      },
    ),
  )

  const datePicker = (
    name: 'issuedOn' | 'passportIssuedOn' | 'chipImplantedOn',
    id: string,
    label: string,
    minDate?: string,
    rules?: RegisterOptions<Values, typeof name>,
  ) => (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        <DatePicker
          id={id}
          label={label}
          value={field.value}
          minDate={minDate}
          maxDate={today}
          onChange={field.onChange}
          error={errors[name]?.message}
        />
      )}
    />
  )

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Rabies vaccination certificate"
      description={`${subject.animal.name} · ${vaccination.vaccineName}, given ${formatDisplayDate(vaccination.givenOn)}${vaccination.batch ? `, batch ${vaccination.batch}` : ''} · owner ${subject.owner.name}`}
      formId="issue-certificate-form"
      submitLabel={print ? 'Issue and print' : 'Issue certificate'}
      isPending={issue.isPending}
      onSubmit={submit}
      onOpen={() => reset(blank(defaultVetName))}
    >
      <div className={layout.formRow}>
        <TextField
          id="certificate-number"
          label="Certificate number *"
          placeholder="P3989553"
          {...register('number', { validate: textRule(20, 'Type the number printed on the form') })}
          error={errors.number?.message}
        />
        {datePicker('issuedOn', 'certificate-issued-on', 'Issued on *', vaccination.givenOn, {
          required: 'Pick the date of issue',
          validate: (value) =>
            (value >= vaccination.givenOn && value <= clinicToday()) ||
            'Between the vaccination and today',
        })}
      </div>
      <div className={layout.formRow}>
        <TextField
          id="certificate-passport"
          label="Pet passport number"
          placeholder="RS 81331825"
          {...register('passportNumber', { validate: textRule(30) })}
          error={errors.passportNumber?.message}
        />
        {datePicker('passportIssuedOn', 'certificate-passport-date', 'Passport issued on')}
      </div>
      {datePicker(
        'chipImplantedOn',
        'certificate-chip-date',
        `Microchip implanted on${subject.animal.chipNumber ? ` (${subject.animal.chipNumber})` : ''}`,
      )}
      <TextField
        id="certificate-issued-by"
        label="Issued by *"
        {...register('issuedBy', { validate: textRule(200, 'Name the issuing clinic') })}
        error={errors.issuedBy?.message}
      />
      <div className={layout.formRow}>
        <TextField
          id="certificate-vet"
          label="Vet *"
          {...register('vetName', { validate: textRule(200, 'Name the vet') })}
          error={errors.vetName?.message}
        />
        <TextField
          id="certificate-licence"
          label="Licence number"
          {...register('vetLicence', { validate: textRule(30) })}
          error={errors.vetLicence?.message}
        />
      </div>
      <FormError message={errors.root?.message} />
    </FormDialog>
  )
}
