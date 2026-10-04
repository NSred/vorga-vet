import { useEffect, useState } from 'react'
import { isApiErrorCode } from '@/shared/lib/apiClient'
import { Button, ConfirmDialog, SlidePanel } from '@/shared/ui'
import {
  appointmentErrorMessage,
  appointmentErrors,
  partyLabel,
  type Appointment,
  type CheckInResponse,
} from '@/features/appointments'
import { generatePatientCardNumber } from '@/features/patients'
import { useCheckInAppointment } from '../hooks/useVisitMutations'
import {
  emptyResolution,
  hasErrors,
  needsAnything,
  needsFor,
  toResolution,
  validateResolution,
  type ResolutionErrors,
  type ResolutionValues,
} from '../lib/resolution'
import { PartyResolutionFields } from './PartyResolutionFields'
import styles from './VisitPanel.module.css'

export interface CheckInPanelProps {
  appointment: Appointment
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: (response: CheckInResponse) => void
  onFailed: (message: string) => void
}

const CLOSING_CODES = [appointmentErrors.invalidTransition, appointmentErrors.notFound]

export function CheckInPanel({
  appointment,
  open,
  onOpenChange,
  onDone,
  onFailed,
}: CheckInPanelProps) {
  const needs = needsFor(appointment)
  const checkIn = useCheckInAppointment()
  const [values, setValues] = useState<ResolutionValues>(emptyResolution)
  const [errors, setErrors] = useState<ResolutionErrors>({})
  const [submitError, setSubmitError] = useState<string | undefined>(undefined)
  const [retriedCard, setRetriedCard] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(emptyResolution())
      setErrors({})
      setSubmitError(undefined)
      setRetriedCard(false)
    }
  }, [open, appointment.id])

  const handleFailure = (error: unknown, attempted: ResolutionValues) => {
    if (isApiErrorCode(error, ...CLOSING_CODES)) {
      onFailed(appointmentErrorMessage(error, 'Could not check in.'))
      return
    }

    if (isApiErrorCode(error, appointmentErrors.patientDoesNotBelongToOwner)) {
      setErrors({ patient: 'This patient belongs to a different owner.' })
      return
    }

    if (isApiErrorCode(error, appointmentErrors.breedNotFound)) {
      setValues({ ...attempted, newPatient: { ...attempted.newPatient, breed: null } })
      setErrors({ breed: 'That breed no longer exists. Pick another.' })
      return
    }

    if (isApiErrorCode(error, appointmentErrors.cardNumberNotUnique)) {
      if (!retriedCard) {
        setRetriedCard(true)
        const regenerated = {
          ...attempted,
          newPatient: {
            ...attempted.newPatient,
            cardNumber: generatePatientCardNumber(attempted.newPatient.species),
          },
        }
        setValues(regenerated)
        submit(regenerated)
        return
      }
      setErrors({ cardNumber: 'This card number is already taken. Try another.' })
      return
    }

    setSubmitError(appointmentErrorMessage(error, 'Could not check in.'))
  }

  const submit = (current: ResolutionValues) => {
    const validation = validateResolution(current, needs)
    setErrors(validation)
    setSubmitError(undefined)
    if (hasErrors(validation)) return

    checkIn.mutate(
      { id: appointment.id, request: toResolution(current, needs) },
      {
        onSuccess: (response) => onDone(response),
        onError: (error) => handleFailure(error, current),
      },
    )
  }

  if (!needsAnything(needs)) {
    return (
      <ConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        title={`Check in ${partyLabel(appointment)}?`}
        description="The appointment moves to checked in and the visit can be recorded."
        confirmLabel="Check in"
        isPending={checkIn.isPending}
        onConfirm={() => submit(values)}
      >
        {submitError && (
          <p role="alert" className={styles.submitError}>
            {submitError}
          </p>
        )}
      </ConfirmDialog>
    )
  }

  return (
    <SlidePanel
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel={`Check in ${partyLabel(appointment)}`}
      headerTone="plain"
      header={
        <div>
          <div className={styles.title}>Check in {partyLabel(appointment)}</div>
          <div className={styles.subtitle}>Fill in what the booking is missing, then check in.</div>
        </div>
      }
      footer={
        <>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="button"
            disabled={checkIn.isPending}
            onClick={() => submit(values)}
          >
            Check in
          </Button>
        </>
      }
    >
      <div className={styles.body}>
        <PartyResolutionFields needs={needs} value={values} onChange={setValues} errors={errors} />
        {submitError && (
          <p role="alert" className={styles.submitError}>
            {submitError}
          </p>
        )}
      </div>
    </SlidePanel>
  )
}
