import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { isApiErrorCode } from '@/shared/lib/apiClient'
import { clinicDateOf, clinicTimeOf } from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { Button, FormError, SlidePanel, useToast } from '@/shared/ui'
import { examinationErrorMessage, examinationErrors } from '../api/examinationErrors'
import { useUpdateExamination } from '../hooks/useExaminationMutations'
import { examinationValuesOf, toExaminationDetails } from '../lib/examinationDetails'
import type { CostSlot, DiagnosisFieldProps, Examination, ExaminationFormValues } from '../types'
import { ExaminationFields } from './ExaminationFields'
import styles from './ExaminationEditPanel.module.css'

export interface ExaminationEditPanelProps {
  examination: Examination
  costSlot: CostSlot
  renderDiagnosis: (field: DiagnosisFieldProps) => ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  onMissing: (message: string) => void
}

export function ExaminationEditPanel({
  examination,
  costSlot,
  renderDiagnosis,
  open,
  onOpenChange,
  onSaved,
  onMissing,
}: ExaminationEditPanelProps) {
  const update = useUpdateExamination()
  const { showToast } = useToast()
  const [submitError, setSubmitError] = useState<string | undefined>(undefined)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExaminationFormValues>({ defaultValues: examinationValuesOf(examination) })

  useEffect(() => {
    if (open) {
      reset(examinationValuesOf(examination))
      setSubmitError(undefined)
    }
  }, [open, examination, reset])

  const save = handleSubmit(async (values) => {
    setSubmitError(undefined)

    try {
      await update.mutateAsync({
        id: examination.id,
        examination: toExaminationDetails(values, costSlot.total),
      })
    } catch (error: unknown) {
      if (isApiErrorCode(error, examinationErrors.notFound)) {
        onMissing(examinationErrorMessage(error, 'That examination no longer exists.'))
        return
      }
      setSubmitError(examinationErrorMessage(error, 'Could not save the examination.'))
      return
    }

    try {
      await costSlot.commit({
        id: examination.id,
        patientId: examination.patientId,
        startedAt: examination.startedAt,
      })
    } catch {
      showToast({
        tone: 'error',
        title: 'The visit was saved, but its charge lines could not be kept',
      })
    }
    onSaved()
  })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    const chargesAreValid = costSlot.validate()
    if (!chargesAreValid) {
      event.preventDefault()
      void handleSubmit(() => undefined)(event)
      return
    }
    void save(event)
  }

  const dateIso = clinicDateOf(examination.startedAt)
  const isPending = isSubmitting || update.isPending

  return (
    <SlidePanel
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel={`Edit visit of ${formatDisplayDate(dateIso)}`}
      headerTone="plain"
      header={
        <div>
          <div className={styles.title}>Edit visit</div>
          <div className={styles.subtitle}>
            {formatDisplayDate(dateIso)} · {clinicTimeOf(examination.startedAt)}
          </div>
        </div>
      }
      footer={
        <>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="examination-edit-form" disabled={isPending}>
            Save
          </Button>
        </>
      }
    >
      <form id="examination-edit-form" onSubmit={submit} className={styles.form}>
        <ExaminationFields
          register={register}
          control={control}
          errors={errors}
          renderDiagnosis={renderDiagnosis}
          costSection={costSlot.section}
        />
        <FormError message={submitError} />
      </form>
    </SlidePanel>
  )
}
