import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { isApiErrorCode } from '@/shared/lib/apiClient'
import { Button, SlidePanel } from '@/shared/ui'
import {
  appointmentErrorMessage,
  appointmentErrors,
  partyLabel,
  type Appointment,
} from '@/features/appointments'
import { useCurrentUser } from '@/features/auth'
import {
  emptyExaminationValues,
  ExaminationFields,
  examinationErrors,
  toExaminationDetails,
  type ExaminationFormValues,
} from '@/features/examinations'
import { generatePatientCardNumber } from '@/features/patients'
import { useCompleteAppointment } from '../hooks/useVisitMutations'
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
import { PaidStep } from './PaidStep'
import { PartyResolutionFields } from './PartyResolutionFields'
import styles from './VisitPanel.module.css'

export interface CompleteVisitPanelProps {
  appointment: Appointment
  open: boolean
  onOpenChange: (open: boolean) => void
  onRecorded: (examinationId: string) => void
  onPaid: () => void
  onFailed: (message: string) => void
}

const CLOSING_CODES = [
  appointmentErrors.invalidTransition,
  appointmentErrors.notFound,
  examinationErrors.appointmentAlreadyHasExamination,
]

type Step = { kind: 'form' } | { kind: 'recorded'; examinationId: string; cost?: number }

export function CompleteVisitPanel({
  appointment,
  open,
  onOpenChange,
  onRecorded,
  onPaid,
  onFailed,
}: CompleteVisitPanelProps) {
  const needs = needsFor(appointment)
  const complete = useCompleteAppointment()
  const profile = useCurrentUser()
  const [step, setStep] = useState<Step>({ kind: 'form' })
  const [resolution, setResolution] = useState<ResolutionValues>(emptyResolution)
  const [resolutionErrors, setResolutionErrors] = useState<ResolutionErrors>({})
  const [submitError, setSubmitError] = useState<string | undefined>(undefined)
  const [retriedCard, setRetriedCard] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<ExaminationFormValues>({
    defaultValues: emptyExaminationValues(profile.data?.firstName, profile.data?.lastName),
  })

  useEffect(() => {
    if (open) {
      setStep({ kind: 'form' })
      setResolution(emptyResolution())
      setResolutionErrors({})
      setSubmitError(undefined)
      setRetriedCard(false)
      reset(emptyExaminationValues(profile.data?.firstName, profile.data?.lastName))
    }
  }, [open, appointment.id, reset, profile.data?.firstName, profile.data?.lastName])

  useEffect(() => {
    if (!profile.data) return
    const untouched = !dirtyFields.performedByFirstName && !dirtyFields.performedByLastName
    const current = getValues()
    if (untouched && !current.performedByFirstName && !current.performedByLastName) {
      reset({
        ...current,
        performedByFirstName: profile.data.firstName,
        performedByLastName: profile.data.lastName,
      })
    }
  }, [profile.data, dirtyFields, getValues, reset])

  const handleFailure = (
    error: unknown,
    attempted: ResolutionValues,
    values: ExaminationFormValues,
  ) => {
    if (isApiErrorCode(error, ...CLOSING_CODES)) {
      onFailed(appointmentErrorMessage(error, 'Could not record the visit.'))
      return
    }

    if (isApiErrorCode(error, appointmentErrors.patientDoesNotBelongToOwner)) {
      setResolutionErrors({ patient: 'This patient belongs to a different owner.' })
      return
    }

    if (isApiErrorCode(error, appointmentErrors.breedNotFound)) {
      setResolution({ ...attempted, newPatient: { ...attempted.newPatient, breed: null } })
      setResolutionErrors({ breed: 'That breed no longer exists. Pick another.' })
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
        setResolution(regenerated)
        send(regenerated, values)
        return
      }
      setResolutionErrors({ cardNumber: 'This card number is already taken. Try another.' })
      return
    }

    setSubmitError(appointmentErrorMessage(error, 'Could not record the visit.'))
  }

  const send = (current: ResolutionValues, values: ExaminationFormValues) => {
    const examination = toExaminationDetails(values)

    complete.mutate(
      { id: appointment.id, request: { ...toResolution(current, needs), examination } },
      {
        onSuccess: (examinationId) => {
          setStep({ kind: 'recorded', examinationId, cost: examination.cost })
          onRecorded(examinationId)
        },
        onError: (error) => handleFailure(error, current, values),
      },
    )
  }

  const submit = handleSubmit((values) => {
    const validation = validateResolution(resolution, needs)
    setResolutionErrors(validation)
    setSubmitError(undefined)
    if (hasErrors(validation)) return

    send(resolution, values)
  })

  const title = `Complete visit · ${partyLabel(appointment)}`
  const isPending = isSubmitting || complete.isPending

  return (
    <SlidePanel
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel={title}
      headerTone="plain"
      header={
        <div>
          <div className={styles.title}>{title}</div>
          <div className={styles.subtitle}>
            {step.kind === 'form'
              ? 'Record what happened at the visit. This closes the appointment.'
              : 'The visit is recorded.'}
          </div>
        </div>
      }
      footer={
        step.kind === 'form' ? (
          <>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="complete-visit-form" disabled={isPending}>
              Record visit
            </Button>
          </>
        ) : (
          <Button variant="primary" type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        )
      }
    >
      {step.kind === 'form' ? (
        <form id="complete-visit-form" onSubmit={submit} className={styles.body}>
          {needsAnything(needs) && (
            <PartyResolutionFields
              needs={needs}
              value={resolution}
              onChange={setResolution}
              errors={resolutionErrors}
            />
          )}
          <h3 className={styles.sectionTitle}>Examination</h3>
          <ExaminationFields register={register} errors={errors} />
          {submitError && (
            <p role="alert" className={styles.submitError}>
              {submitError}
            </p>
          )}
        </form>
      ) : (
        <PaidStep examinationId={step.examinationId} cost={step.cost} onPaid={onPaid} />
      )}
    </SlidePanel>
  )
}
