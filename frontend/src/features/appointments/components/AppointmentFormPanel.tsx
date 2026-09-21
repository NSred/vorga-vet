import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { isApiErrorCode } from '@/shared/lib/apiClient'
import { clinicDateOf, clinicDayRange, clinicToday } from '@/shared/lib/clinicTime'
import { Button, DatePicker, Select, SlidePanel, Textarea } from '@/shared/ui'
import { appointmentErrorMessage, appointmentErrors } from '../api/appointmentErrors'
import { useCreateAppointment, useRescheduleAppointment } from '../hooks/useAppointmentMutations'
import { useAvailabilityQuery } from '../hooks/useAvailabilityQuery'
import { partyLabel, typeLabel } from '../lib/appointmentLabels'
import { toCreateRequest, toRescheduleRequest } from '../lib/appointmentRequest'
import { isSelectable, slotOptions } from '../lib/slotOptions'
import type { Appointment, AppointmentType, AppointmentWriteValues, PartyRef } from '../types'
import styles from './AppointmentFormPanel.module.css'

export interface PartyField {
  value: PartyRef | null
  onChange: (value: PartyRef | null) => void
  error?: string
}

export type AppointmentFormVariant = 'vet' | 'client'

export interface AppointmentFormPanelProps {
  mode: 'create' | 'reschedule'
  variant?: AppointmentFormVariant
  appointment?: Appointment
  initialDate: string
  initialStartsAt?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  ownerField?: (field: PartyField) => ReactElement
  patientField?: (field: PartyField) => ReactElement
}

const TYPES: AppointmentType[] = ['first_visit', 'checkup', 'blood_draw', 'surgery']
const CLIENT_TYPES = TYPES.filter((type) => type !== 'surgery')

function typeOptions(variant: AppointmentFormVariant) {
  const allowed = variant === 'client' ? CLIENT_TYPES : TYPES

  return allowed.map((type) => ({ value: type, label: typeLabel(type) }))
}
const DURATION_OPTIONS = Array.from({ length: 16 }, (_, index) => (index + 1) * 30).map(
  (minutes) => ({ value: String(minutes), label: `${minutes} min` }),
)

function partyOf(id: string | undefined, label: string | undefined): PartyRef | null {
  return id ? { id, label: label ?? id } : null
}

function buildDefaults(
  mode: AppointmentFormPanelProps['mode'],
  appointment: Appointment | undefined,
  initialDate: string,
  initialStartsAt: string | undefined,
): AppointmentWriteValues {
  if (mode === 'reschedule' && appointment) {
    return {
      date: clinicDateOf(appointment.startsAt),
      startsAt: appointment.startsAt,
      type: appointment.type,
      durationMinutes: appointment.durationMinutes,
      owner: partyOf(appointment.ownerId, appointment.ownerName),
      patient: partyOf(appointment.patientId, appointment.patientName),
      reason: appointment.reason ?? '',
    }
  }

  return {
    date: initialDate,
    startsAt: initialStartsAt ?? '',
    type: 'checkup',
    durationMinutes: 30,
    owner: null,
    patient: null,
    reason: '',
  }
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.summary}>
      <span className={styles.summaryLabel}>{label}</span>
      <span className={styles.summaryValue}>{value}</span>
    </div>
  )
}

export function AppointmentFormPanel({
  mode,
  variant = 'vet',
  appointment,
  initialDate,
  initialStartsAt,
  open,
  onOpenChange,
  onSaved,
  ownerField,
  patientField,
}: AppointmentFormPanelProps) {
  const [submitError, setSubmitError] = useState<string | undefined>(undefined)
  const create = useCreateAppointment()
  const reschedule = useRescheduleAppointment()
  const {
    control,
    handleSubmit,
    register,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentWriteValues>({
    defaultValues: buildDefaults(mode, appointment, initialDate, initialStartsAt),
  })

  const date = watch('date')
  const type = watch('type')
  const durationMinutes = watch('durationMinutes')
  const startsAt = watch('startsAt')
  const isReschedule = mode === 'reschedule'
  const isClient = variant === 'client'
  const isSurgery = !isClient && type === 'surgery'

  useEffect(() => {
    if (open) {
      reset(buildDefaults(mode, appointment, initialDate, initialStartsAt))
      setSubmitError(undefined)
    }
  }, [open, mode, appointment, initialDate, initialStartsAt, reset])

  useEffect(() => {
    if (!isSurgery && durationMinutes !== 30) {
      setValue('durationMinutes', 30)
    }
  }, [isSurgery, durationMinutes, setValue])

  const availabilityQuery = useAvailabilityQuery(clinicDayRange(date), {
    durationMinutes: isSurgery ? durationMinutes : undefined,
    enabled: open && Boolean(date),
  })

  const options = useMemo(() => {
    const all = slotOptions(
      availabilityQuery.data ?? [],
      isReschedule ? appointment : undefined,
      Date.now(),
    )

    if (!isClient) {
      return all.filter((option) => !option.disabled)
    }

    // A client sees their own bookings in place, disabled, instead of an unexplained gap.
    return all
      .filter((option) => !option.disabled || option.isMine)
      .map((option) => (option.disabled ? { ...option, label: `${option.label} · yours` } : option))
  }, [availabilityQuery.data, isReschedule, appointment, isClient])

  useEffect(() => {
    if (availabilityQuery.isSuccess && startsAt && !isSelectable(options, startsAt)) {
      setValue('startsAt', '')
    }
  }, [availabilityQuery.isSuccess, options, startsAt, setValue])

  function handleFailure(error: unknown) {
    if (isApiErrorCode(error, appointmentErrors.slotTaken)) {
      setError('startsAt', { message: 'That time was just taken. Pick another slot.' })
      void availabilityQuery.refetch()
      return
    }

    if (isApiErrorCode(error, appointmentErrors.patientDoesNotBelongToOwner)) {
      setError('patient', { message: 'This patient belongs to a different owner.' })
      return
    }

    if (isApiErrorCode(error, appointmentErrors.ownerNotFound)) {
      setValue('owner', null)
      setSubmitError('That owner no longer exists. Please select another.')
      return
    }

    if (isApiErrorCode(error, appointmentErrors.patientNotFound)) {
      setValue('patient', null)
      setSubmitError('That patient no longer exists. Please select another.')
      return
    }

    setSubmitError(appointmentErrorMessage(error, 'Could not save the appointment.'))
  }

  const submit = handleSubmit(async (values) => {
    setSubmitError(undefined)

    try {
      if (isReschedule && appointment) {
        await reschedule.mutateAsync({ id: appointment.id, request: toRescheduleRequest(values) })
      } else {
        await create.mutateAsync(toCreateRequest(values))
      }
      onSaved()
    } catch (error: unknown) {
      handleFailure(error)
    }
  })

  const isPending = isSubmitting || create.isPending || reschedule.isPending
  const title = isReschedule
    ? isClient || !appointment
      ? 'Move your visit'
      : `Move ${partyLabel(appointment)}`
    : isClient
      ? 'Book a visit'
      : 'New appointment'
  const noSlots = availabilityQuery.isSuccess && options.length === 0

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
            {isReschedule
              ? 'Pick a new date and time.'
              : 'Pick a free slot and fill in the details.'}
          </div>
        </div>
      }
      footer={
        <>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="appointment-form" disabled={isPending}>
            {isReschedule ? 'Move' : 'Book'}
          </Button>
        </>
      }
    >
      <form id="appointment-form" onSubmit={submit} className={styles.form}>
        {isReschedule && appointment && (
          <div className={styles.summaryGrid}>
            <Summary label="Type" value={typeLabel(appointment.type)} />
            <Summary label="Patient" value={appointment.patientName ?? 'No patient yet'} />
            <Summary label="Owner" value={appointment.ownerName ?? 'No owner yet'} />
          </div>
        )}

        <div className={styles.row}>
          <Controller
            name="date"
            control={control}
            rules={{ required: 'Pick a date' }}
            render={({ field }) => (
              <DatePicker
                id="appointment-date"
                label="Date *"
                value={field.value}
                onChange={field.onChange}
                minDate={clinicToday()}
                error={errors.date?.message}
              />
            )}
          />
          <Controller
            name="startsAt"
            control={control}
            rules={{
              required: 'Pick a start time',
              validate: (value) =>
                !value || Date.parse(value) > Date.now()
                  ? true
                  : 'Pick a start time in the future',
            }}
            render={({ field }) => (
              <Select
                id="appointment-start"
                label="Start time *"
                value={field.value}
                onChange={field.onChange}
                options={options}
                placeholder={noSlots ? 'No free slots' : 'Select a time'}
                error={errors.startsAt?.message}
              />
            )}
          />
        </div>

        {!isReschedule && (
          <div className={styles.row}>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  id="appointment-type"
                  label="Type"
                  value={field.value}
                  onChange={(value) => field.onChange(value as AppointmentType)}
                  options={typeOptions(variant)}
                />
              )}
            />
            {isSurgery && (
              <Controller
                name="durationMinutes"
                control={control}
                render={({ field }) => (
                  <Select
                    id="appointment-duration"
                    label="Duration"
                    value={String(field.value)}
                    onChange={(value) => field.onChange(Number(value))}
                    options={DURATION_OPTIONS}
                  />
                )}
              />
            )}
          </div>
        )}

        {isReschedule && isSurgery && (
          <Controller
            name="durationMinutes"
            control={control}
            render={({ field }) => (
              <Select
                id="appointment-duration"
                label="Duration"
                value={String(field.value)}
                onChange={(value) => field.onChange(Number(value))}
                options={DURATION_OPTIONS}
              />
            )}
          />
        )}

        {!isReschedule && (
          <>
            {patientField && (
              <Controller
                name="patient"
                control={control}
                render={({ field }) =>
                  patientField({
                    value: field.value,
                    onChange: field.onChange,
                    error: errors.patient?.message,
                  })
                }
              />
            )}
            {ownerField && (
              <Controller
                name="owner"
                control={control}
                render={({ field }) =>
                  ownerField({
                    value: field.value,
                    onChange: field.onChange,
                    error: errors.owner?.message,
                  })
                }
              />
            )}
            <Textarea
              id="appointment-reason"
              label="Reason"
              placeholder="Why the animal is coming in…"
              {...register('reason', {
                maxLength: { value: 1000, message: 'Maximum 1000 characters' },
              })}
              error={errors.reason?.message}
            />
          </>
        )}

        {submitError && (
          <p role="alert" className={styles.submitError}>
            {submitError}
          </p>
        )}
      </form>
    </SlidePanel>
  )
}
