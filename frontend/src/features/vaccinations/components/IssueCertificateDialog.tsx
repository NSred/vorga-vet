import { useEffect, useState } from 'react'
import { isApiErrorCode } from '@/shared/lib/apiClient'
import { clinicToday } from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { Button, DatePicker, FormError, Modal, TextField } from '@/shared/ui'
import { vaccinationErrorMessage, vaccinationErrors } from '../api/vaccinationErrors'
import { useIssueCertificate, useLastIssuer } from '../hooks/useCertificates'
import type { CertificateSubject, RabiesCertificate, Vaccination } from '../types'
import styles from './VaccinationForms.module.css'

export interface IssueCertificateDialogProps {
  vaccination: Vaccination
  subject: CertificateSubject
  defaultVetName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onIssued: (certificate: RabiesCertificate) => void
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

type Errors = Partial<Record<keyof Values | 'submit', string>>

const DEFAULT_ISSUER = 'VorgaVet'

function validate(values: Values, givenOn: string, today: string): Errors {
  const errors: Errors = {}
  const number = values.number.trim()
  if (!number) errors.number = 'Type the number printed on the form'
  else if (number.length > 20) errors.number = 'Maximum 20 characters'
  if (!values.issuedOn) errors.issuedOn = 'Pick the date of issue'
  else if (values.issuedOn < givenOn || values.issuedOn > today) {
    errors.issuedOn = 'Between the vaccination and today'
  }
  if (values.passportNumber.trim().length > 30) errors.passportNumber = 'Maximum 30 characters'
  if (!values.issuedBy.trim()) errors.issuedBy = 'Name the issuing clinic'
  else if (values.issuedBy.trim().length > 200) errors.issuedBy = 'Maximum 200 characters'
  if (!values.vetName.trim()) errors.vetName = 'Name the vet'
  else if (values.vetName.trim().length > 200) errors.vetName = 'Maximum 200 characters'
  if (values.vetLicence.trim().length > 30) errors.vetLicence = 'Maximum 30 characters'
  return errors
}

export function IssueCertificateDialog({
  vaccination,
  subject,
  defaultVetName,
  open,
  onOpenChange,
  onIssued,
}: IssueCertificateDialogProps) {
  const issue = useIssueCertificate()
  const lastIssuer = useLastIssuer(open)
  const today = clinicToday()
  const [values, setValues] = useState<Values>(() => blank(today, defaultVetName))
  const [errors, setErrors] = useState<Errors>({})

  useEffect(() => {
    if (!open) return
    setValues(blank(clinicToday(), defaultVetName))
    setErrors({})
  }, [open, defaultVetName])

  useEffect(() => {
    const remembered = lastIssuer.data
    if (!open || !remembered) return
    setValues((current) => ({
      ...current,
      issuedBy: remembered.issuedBy ?? current.issuedBy,
      vetLicence: remembered.vetLicence ?? current.vetLicence,
    }))
  }, [open, lastIssuer.data])

  const set = (key: keyof Values) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }))

  const submit = () => {
    const found = validate(values, vaccination.givenOn, today)
    setErrors(found)
    if (Object.keys(found).length > 0) return

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
            setErrors({ number: 'This number was already used on another certificate' })
            return
          }
          setErrors({
            submit: vaccinationErrorMessage(error, 'Could not issue the certificate.'),
          })
        },
      },
    )
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Rabies vaccination certificate"
      description={`${subject.animal.name} · ${vaccination.vaccineName}, given ${formatDisplayDate(vaccination.givenOn)}${vaccination.batch ? `, batch ${vaccination.batch}` : ''} · owner ${subject.owner.name}`}
      footer={
        <>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={submit} disabled={issue.isPending}>
            Issue and print
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <div className={styles.row}>
          <TextField
            id="certificate-number"
            label="Certificate number *"
            placeholder="P3989553"
            value={values.number}
            onChange={(event) => set('number')(event.target.value)}
            error={errors.number}
          />
          <DatePicker
            id="certificate-issued-on"
            label="Issued on *"
            value={values.issuedOn}
            minDate={vaccination.givenOn}
            maxDate={today}
            onChange={set('issuedOn')}
            error={errors.issuedOn}
          />
        </div>
        <div className={styles.row}>
          <TextField
            id="certificate-passport"
            label="Pet passport number"
            placeholder="RS 81331825"
            value={values.passportNumber}
            onChange={(event) => set('passportNumber')(event.target.value)}
            error={errors.passportNumber}
          />
          <DatePicker
            id="certificate-passport-date"
            label="Passport issued on"
            value={values.passportIssuedOn}
            maxDate={today}
            onChange={set('passportIssuedOn')}
          />
        </div>
        <DatePicker
          id="certificate-chip-date"
          label={`Microchip implanted on${subject.animal.chipNumber ? ` (${subject.animal.chipNumber})` : ''}`}
          value={values.chipImplantedOn}
          maxDate={today}
          onChange={set('chipImplantedOn')}
        />
        <TextField
          id="certificate-issued-by"
          label="Issued by *"
          value={values.issuedBy}
          onChange={(event) => set('issuedBy')(event.target.value)}
          error={errors.issuedBy}
        />
        <div className={styles.row}>
          <TextField
            id="certificate-vet"
            label="Vet *"
            value={values.vetName}
            onChange={(event) => set('vetName')(event.target.value)}
            error={errors.vetName}
          />
          <TextField
            id="certificate-licence"
            label="Licence number"
            value={values.vetLicence}
            onChange={(event) => set('vetLicence')(event.target.value)}
            error={errors.vetLicence}
          />
        </div>
        <FormError message={errors.submit} />
      </div>
    </Modal>
  )
}

function blank(today: string, vetName: string): Values {
  return {
    number: '',
    issuedOn: today,
    passportNumber: '',
    passportIssuedOn: '',
    chipImplantedOn: '',
    issuedBy: DEFAULT_ISSUER,
    vetName,
    vetLicence: '',
  }
}
