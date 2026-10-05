import { useEffect, useState } from 'react'
import { isApiErrorCode } from '@/shared/lib/apiClient'
import { clinicToday } from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import {
  Button,
  Checkbox,
  DatePicker,
  FormError,
  Modal,
  SegmentedControl,
  TextField,
} from '@/shared/ui'
import { microchipErrorMessage, microchipErrors } from '../api/microchipErrors'
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

interface Errors {
  implantedOn?: string
  clinic?: string
  vetName?: string
  jmbg?: string
  submit?: string
}

const DEFAULT_CLINIC = 'VorgaVet'
const STERILISED_OPTIONS = (['yes', 'no', 'unknown'] as const).map((value) => ({
  value,
  label: STERILISED_LABELS[value],
}))

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
  const register = useRegisterMicrochip()
  const remembered = useLastClinic(open)
  const today = clinicToday()
  const [implantedOn, setImplantedOn] = useState(today)
  const [sterilised, setSterilised] = useState<Sterilised>('unknown')
  const [consent, setConsent] = useState(false)
  const [clinic, setClinic] = useState(DEFAULT_CLINIC)
  const [vetName, setVetName] = useState(defaultVetName)
  const [jmbg, setJmbg] = useState('')
  const [errors, setErrors] = useState<Errors>({})

  useEffect(() => {
    if (!open) return
    setImplantedOn(clinicToday())
    setSterilised('unknown')
    setConsent(false)
    setClinic(DEFAULT_CLINIC)
    setVetName(defaultVetName)
    setJmbg('')
    setErrors({})
  }, [open, defaultVetName])

  useEffect(() => {
    if (open && remembered.data?.clinic) setClinic(remembered.data.clinic)
  }, [open, remembered.data])

  const submit = () => {
    const found: Errors = {}
    if (!implantedOn) found.implantedOn = 'Pick the implant date'
    if (!clinic.trim()) found.clinic = 'Name the clinic'
    else if (clinic.trim().length > 200) found.clinic = 'Maximum 200 characters'
    if (!vetName.trim()) found.vetName = 'Name the vet'
    else if (vetName.trim().length > 200) found.vetName = 'Maximum 200 characters'
    const jmbgProblem = jmbgError(jmbg)
    if (jmbgProblem) found.jmbg = jmbgProblem
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const ownerJmbg = jmbg.trim()
    register.mutate(
      {
        patientId,
        request: {
          chipNumber,
          implantedOn,
          sterilised,
          consentToPublish: consent,
          animal: subject.animal,
          owner: subject.owner,
          lastRabies: lastRabies ?? null,
          clinic: clinic.trim(),
          vetName: vetName.trim(),
        },
      },
      {
        onSuccess: (registration) => onRegistered(registration, ownerJmbg),
        onError: (error) =>
          setErrors({
            submit: isApiErrorCode(error, microchipErrors.alreadyRegistered)
              ? 'This chip number is already registered'
              : microchipErrorMessage(error, 'Could not register the microchip.'),
          }),
      },
    )
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Register microchip"
      description={`${subject.animal.name} · chip ${chipNumber} · owner ${subject.owner.name}`}
      footer={
        <>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={submit} disabled={register.isPending}>
            Register and print
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <div className={styles.row}>
          <DatePicker
            id="chip-implanted-on"
            label="Implanted on *"
            value={implantedOn}
            maxDate={today}
            onChange={setImplantedOn}
            error={errors.implantedOn}
          />
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Sterilised</span>
            <SegmentedControl
              value={sterilised}
              onChange={setSterilised}
              options={STERILISED_OPTIONS}
            />
          </div>
        </div>
        <p className={styles.note}>
          Last rabies vaccination:{' '}
          {lastRabies
            ? `${lastRabies.vaccineName}, ${formatDisplayDate(lastRabies.givenOn)}`
            : 'none recorded'}
        </p>
        <Checkbox checked={consent} onChange={setConsent}>
          The owner consents to publishing the data online
        </Checkbox>
        <div className={styles.row}>
          <TextField
            id="chip-clinic"
            label="Clinic *"
            value={clinic}
            onChange={(event) => setClinic(event.target.value)}
            error={errors.clinic}
          />
          <TextField
            id="chip-vet"
            label="Vet *"
            value={vetName}
            onChange={(event) => setVetName(event.target.value)}
            error={errors.vetName}
          />
        </div>
        <TextField
          id="chip-jmbg"
          label="Owner’s JMBG *"
          inputMode="numeric"
          autoComplete="off"
          value={jmbg}
          onChange={(event) => setJmbg(event.target.value)}
          error={errors.jmbg}
        />
        <p className={styles.note}>The JMBG is printed on the sheet and never saved.</p>
        <FormError message={errors.submit} />
      </div>
    </Modal>
  )
}
