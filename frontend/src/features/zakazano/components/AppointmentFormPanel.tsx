import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { SPECIES_EMOJI, type Patient } from '@/features/kartoteka'
import { Button, Select, SlidePanel, TextField, Textarea } from '@/shared/ui'
import { todayIso } from '@/shared/lib/dateOnly'
import type { Appointment, AppointmentInput } from '../types'
import styles from './AppointmentFormPanel.module.css'

export interface AppointmentFormPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  initialAppointment?: Appointment
  patients: Patient[]
  onSubmit: (input: AppointmentInput) => Promise<void>
  onDelete?: () => void
}

function buildDefaultValues(
  mode: 'create' | 'edit',
  initialAppointment: Appointment | undefined,
  patients: Patient[],
): AppointmentInput {
  if (mode === 'edit' && initialAppointment) {
    const { patientId, date, time, type, note, reminderEnabled } = initialAppointment
    return { patientId, date, time, type, note, reminderEnabled }
  }
  return {
    patientId: patients[0]?.id ?? '',
    date: todayIso(),
    time: '09:00',
    type: 'kontrola',
    reminderEnabled: false,
  }
}

export function AppointmentFormPanel({
  open,
  onOpenChange,
  mode,
  initialAppointment,
  patients,
  onSubmit,
  onDelete,
}: AppointmentFormPanelProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentInput>({ defaultValues: buildDefaultValues(mode, initialAppointment, patients) })

  useEffect(() => {
    if (open) {
      reset(buildDefaultValues(mode, initialAppointment, patients))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, initialAppointment, patients])

  const submit = handleSubmit(async (values) => {
    await onSubmit(values)
  })

  const patientOptions = patients.map((patient) => ({
    value: patient.id,
    label: `${SPECIES_EMOJI[patient.species]} ${patient.name} · ${patient.ownerName}`,
  }))

  return (
    <SlidePanel
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel={mode === 'create' ? 'Novi termin' : 'Izmena termina'}
      headerTone="plain"
      header={
        <div>
          <div className={styles.title}>{mode === 'create' ? 'Novi termin' : 'Izmena termina'}</div>
          {mode === 'edit' && initialAppointment && (
            <div className={styles.subtitle}>
              {initialAppointment.date} · {initialAppointment.time}
            </div>
          )}
        </div>
      }
      footer={
        mode === 'create' ? (
          <>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Odustani
            </Button>
            <Button variant="primary" type="submit" form="appointment-form" disabled={isSubmitting}>
              Sačuvaj termin
            </Button>
          </>
        ) : (
          <>
            <Button variant="danger" type="button" onClick={onDelete}>
              Obriši
            </Button>
            <Button variant="primary" type="submit" form="appointment-form" disabled={isSubmitting}>
              Sačuvaj izmene
            </Button>
          </>
        )
      }
    >
      <form id="appointment-form" onSubmit={submit} className={styles.form}>
        <div className={styles.row}>
          <TextField
            id="date"
            label="Datum *"
            type="date"
            {...register('date', { required: 'Datum je obavezan' })}
            error={errors.date?.message}
          />
          <TextField id="time" label="Vreme" type="time" {...register('time')} />
        </div>

        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select
              id="type"
              label="Tip termina"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'prvi_pregled', label: 'Prvi pregled' },
                { value: 'kontrola', label: 'Kontrola' },
                { value: 'vakcinacija', label: 'Vakcinacija' },
                { value: 'ostalo', label: 'Ostalo' },
              ]}
            />
          )}
        />

        <Controller
          name="patientId"
          control={control}
          rules={{ required: 'Pacijent je obavezan' }}
          render={({ field }) => (
            <Select
              id="patientId"
              label="Pacijent (vlasnik) *"
              value={field.value}
              onChange={field.onChange}
              options={patientOptions}
            />
          )}
        />

        <Textarea
          id="note"
          label="Intervencija / napomena"
          {...register('note')}
          className={styles.fullWidth}
        />

        <label className={styles.checkbox}>
          <input type="checkbox" {...register('reminderEnabled')} />
          Automatski podseti vlasnika dan pre
        </label>
      </form>
    </SlidePanel>
  )
}
