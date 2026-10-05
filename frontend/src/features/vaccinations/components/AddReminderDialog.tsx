import { useEffect, useState, type ReactNode } from 'react'
import { clinicToday } from '@/shared/lib/clinicTime'
import { Button, DatePicker, FormError, Modal, TextField } from '@/shared/ui'
import { vaccinationErrorMessage } from '../api/vaccinationErrors'
import { useAddReminder } from '../hooks/useVaccinationMutations'
import styles from './VaccinationForms.module.css'

export interface AddReminderDialogProps {
  patientId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded: (reason: string) => void
  patientField?: (error: string | undefined) => ReactNode
}

interface Errors {
  reason?: string
  date?: string
  submit?: string
}

export function AddReminderDialog({
  patientId,
  open,
  onOpenChange,
  onAdded,
  patientField,
}: AddReminderDialogProps) {
  const add = useAddReminder()
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [showPatientMissing, setShowPatientMissing] = useState(false)

  useEffect(() => {
    if (!open) return
    setDate('')
    setReason('')
    setErrors({})
    setShowPatientMissing(false)
  }, [open])

  const submit = () => {
    const found: Errors = {}
    if (!reason.trim()) found.reason = 'Say what to remind about'
    else if (reason.trim().length > 200) found.reason = 'Maximum 200 characters'
    if (!date) found.date = 'Pick a date'
    setErrors(found)
    setShowPatientMissing(!patientId)
    if (Object.keys(found).length > 0 || !patientId) return

    add.mutate(
      { patientId, request: { date, reason: reason.trim() } },
      {
        onSuccess: () => onAdded(reason.trim()),
        onError: (error) =>
          setErrors({ submit: vaccinationErrorMessage(error, 'Could not add the reminder.') }),
      },
    )
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add a reminder"
      description="It appears on the Reminders page from its date until it is marked done."
      footer={
        <>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={submit} disabled={add.isPending}>
            Add reminder
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        {patientField?.(showPatientMissing && !patientId ? 'Pick the patient' : undefined)}
        <DatePicker
          id="reminder-date"
          label="Date *"
          value={date}
          minDate={clinicToday()}
          onChange={setDate}
          error={errors.date}
        />
        <TextField
          id="reminder-reason"
          label="Reason *"
          placeholder="Remind about spaying"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          error={errors.reason}
        />
        <FormError message={errors.submit} />
      </div>
    </Modal>
  )
}
