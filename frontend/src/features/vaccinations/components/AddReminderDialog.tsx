import { useState, type FormEvent, type ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { apiErrorMessage } from '@/shared/lib/apiClient'
import { clinicToday } from '@/shared/lib/clinicTime'
import { textRule } from '@/shared/lib/formRules'
import { DatePicker, FormDialog, FormError, TextField } from '@/shared/ui'
import { useAddReminder } from '../hooks/useVaccinationMutations'

export interface AddReminderDialogProps {
  patientId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded: (reason: string) => void
  patientField?: (error: string | undefined) => ReactNode
}

interface Values {
  date: string
  reason: string
}

const BLANK: Values = { date: '', reason: '' }

export function AddReminderDialog({
  patientId,
  open,
  onOpenChange,
  onAdded,
  patientField,
}: AddReminderDialogProps) {
  const add = useAddReminder()
  const [showPatientMissing, setShowPatientMissing] = useState(false)
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<Values>({ defaultValues: BLANK })

  const save = handleSubmit((values) => {
    if (!patientId) return
    const reason = values.reason.trim()
    add.mutate(
      { patientId, request: { date: values.date, reason } },
      {
        onSuccess: () => onAdded(reason),
        onError: (error) =>
          setError('root', { message: apiErrorMessage(error, 'Could not add the reminder.') }),
      },
    )
  })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    setShowPatientMissing(!patientId)
    return save(event)
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add a reminder"
      description="It appears on the Reminders page from its date until it is marked done."
      formId="add-reminder-form"
      submitLabel="Add reminder"
      isPending={add.isPending}
      onSubmit={submit}
      onOpen={() => {
        reset(BLANK)
        setShowPatientMissing(false)
      }}
    >
      {patientField?.(showPatientMissing && !patientId ? 'Pick the patient' : undefined)}
      <Controller
        name="date"
        control={control}
        rules={{ required: 'Pick a date' }}
        render={({ field }) => (
          <DatePicker
            id="reminder-date"
            label="Date *"
            value={field.value}
            minDate={clinicToday()}
            onChange={field.onChange}
            error={errors.date?.message}
          />
        )}
      />
      <TextField
        id="reminder-reason"
        label="Reason *"
        placeholder="Remind about spaying"
        {...register('reason', { validate: textRule(200, 'Say what to remind about') })}
        error={errors.reason?.message}
      />
      <FormError message={errors.root?.message} />
    </FormDialog>
  )
}
