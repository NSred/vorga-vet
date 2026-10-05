import { useEffect, useState } from 'react'
import { addClinicDays, clinicToday } from '@/shared/lib/clinicTime'
import { Button, Checkbox, DatePicker, FormError, Modal, TextField } from '@/shared/ui'
import { vaccinationErrorMessage } from '../api/vaccinationErrors'
import { useAddVaccination } from '../hooks/useVaccinationMutations'
import styles from './VaccinationForms.module.css'

export interface AddVaccinationDialogProps {
  patientId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded: (vaccineName: string) => void
}

interface Errors {
  vaccineName?: string
  batch?: string
  givenOn?: string
  dueOn?: string
  submit?: string
}

const DEFAULT_VALIDITY_DAYS = 365

export function AddVaccinationDialog({
  patientId,
  open,
  onOpenChange,
  onAdded,
}: AddVaccinationDialogProps) {
  const add = useAddVaccination()
  const today = clinicToday()
  const [vaccineName, setVaccineName] = useState('')
  const [isRabies, setIsRabies] = useState(false)
  const [batch, setBatch] = useState('')
  const [givenOn, setGivenOn] = useState(today)
  const [dueOn, setDueOn] = useState(addClinicDays(today, DEFAULT_VALIDITY_DAYS))
  const [dueTouched, setDueTouched] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  useEffect(() => {
    if (!open) return
    const now = clinicToday()
    setVaccineName('')
    setIsRabies(false)
    setBatch('')
    setGivenOn(now)
    setDueOn(addClinicDays(now, DEFAULT_VALIDITY_DAYS))
    setDueTouched(false)
    setErrors({})
  }, [open])

  const changeGivenOn = (next: string) => {
    setGivenOn(next)
    if (!dueTouched && next) setDueOn(addClinicDays(next, DEFAULT_VALIDITY_DAYS))
  }

  const submit = () => {
    const found: Errors = {}
    if (!vaccineName.trim()) found.vaccineName = 'Name the vaccine'
    else if (vaccineName.trim().length > 200) found.vaccineName = 'Maximum 200 characters'
    if (batch.trim().length > 50) found.batch = 'Maximum 50 characters'
    if (!givenOn) found.givenOn = 'Pick the date it was given'
    if (!dueOn) found.dueOn = 'Pick the next due date'
    else if (givenOn && dueOn <= givenOn) found.dueOn = 'The next dose must come after this one'
    setErrors(found)
    if (Object.keys(found).length > 0) return

    add.mutate(
      {
        patientId,
        request: {
          vaccineName: vaccineName.trim(),
          isRabies,
          batch: batch.trim() || null,
          givenOn,
          dueOn,
        },
      },
      {
        onSuccess: () => onAdded(vaccineName.trim()),
        onError: (error) =>
          setErrors({ submit: vaccinationErrorMessage(error, 'Could not add the vaccination.') }),
      },
    )
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add a vaccination"
      description="For a vaccine given elsewhere or before VorgaVet. Vaccines given here are recorded from the exam."
      footer={
        <>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={submit} disabled={add.isPending}>
            Add vaccination
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <TextField
          id="manual-vaccine-name"
          label="Vaccine *"
          placeholder="Nobivac Rabies"
          value={vaccineName}
          onChange={(event) => setVaccineName(event.target.value)}
          error={errors.vaccineName}
        />
        <Checkbox checked={isRabies} onChange={setIsRabies}>
          Rabies vaccine
        </Checkbox>
        <div className={styles.row}>
          <DatePicker
            id="manual-vaccine-given"
            label="Given on *"
            value={givenOn}
            maxDate={today}
            onChange={changeGivenOn}
            error={errors.givenOn}
          />
          <DatePicker
            id="manual-vaccine-due"
            label="Next due *"
            value={dueOn}
            minDate={givenOn ? addClinicDays(givenOn, 1) : undefined}
            onChange={(next) => {
              setDueTouched(true)
              setDueOn(next)
            }}
            error={errors.dueOn}
          />
        </div>
        <TextField
          id="manual-vaccine-batch"
          label="Batch"
          value={batch}
          onChange={(event) => setBatch(event.target.value)}
          error={errors.batch}
        />
        <FormError message={errors.submit} />
      </div>
    </Modal>
  )
}
