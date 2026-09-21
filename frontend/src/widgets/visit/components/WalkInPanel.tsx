import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { isApiErrorCode } from '@/shared/lib/apiClient'
import { Button, SlidePanel } from '@/shared/ui'
import { useCurrentUser } from '@/features/auth'
import {
  emptyExaminationValues,
  ExaminationFields,
  examinationErrorMessage,
  examinationErrors,
  toExaminationDetails,
  useCreateExamination,
  type ExaminationFormValues,
} from '@/features/examinations'
import { PatientPicker, type PatientListItem } from '@/features/patients'
import { PaidStep } from './PaidStep'
import styles from './VisitPanel.module.css'

export interface WalkInPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRecorded: (examinationId: string) => void
  onPaid: () => void
}

type Step = { kind: 'form' } | { kind: 'recorded'; examinationId: string; cost?: number }

export function WalkInPanel({ open, onOpenChange, onRecorded, onPaid }: WalkInPanelProps) {
  const create = useCreateExamination()
  const profile = useCurrentUser()
  const [step, setStep] = useState<Step>({ kind: 'form' })
  const [patient, setPatient] = useState<PatientListItem | null>(null)
  const [patientError, setPatientError] = useState<string | undefined>(undefined)
  const [submitError, setSubmitError] = useState<string | undefined>(undefined)

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
      setPatient(null)
      setPatientError(undefined)
      setSubmitError(undefined)
      reset(emptyExaminationValues(profile.data?.firstName, profile.data?.lastName))
    }
  }, [open, reset, profile.data?.firstName, profile.data?.lastName])

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

  const submit = handleSubmit((values) => {
    setSubmitError(undefined)

    if (!patient) {
      setPatientError('Pick the patient')
      return
    }
    setPatientError(undefined)

    const examination = toExaminationDetails(values)

    create.mutate(
      { patientId: patient.id, examination },
      {
        onSuccess: (examinationId) => {
          setStep({ kind: 'recorded', examinationId, cost: examination.cost })
          onRecorded(examinationId)
        },
        onError: (error) => {
          if (isApiErrorCode(error, examinationErrors.patientNotFound)) {
            setPatient(null)
            setPatientError('That patient no longer exists. Pick another.')
            return
          }
          setSubmitError(examinationErrorMessage(error, 'Could not record the visit.'))
        },
      },
    )
  })

  const isPending = isSubmitting || create.isPending

  return (
    <SlidePanel
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel="Walk-in visit"
      headerTone="plain"
      header={
        <div>
          <div className={styles.title}>Walk-in visit</div>
          <div className={styles.subtitle}>
            {step.kind === 'form'
              ? 'An examination without an appointment behind it.'
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
            <Button variant="primary" type="submit" form="walk-in-form" disabled={isPending}>
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
        <form id="walk-in-form" onSubmit={submit} className={styles.body}>
          <PatientPicker value={patient} onChange={setPatient} error={patientError} />
          <p className={styles.notice}>
            The animal needs a card first. If it is not found, create it in{' '}
            <Link to="/patients">Patient Records</Link> and come back.
          </p>
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
