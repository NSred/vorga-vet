import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { isApiErrorCode } from '@/shared/lib/apiClient'
import {
  addClinicDays,
  clinicDateOf,
  clinicDayRange,
  clinicToday,
  clinicUpcomingDaysRange,
} from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import {
  DetailSection,
  Button,
  DatePicker,
  fieldStyles,
  FormError,
  layout,
  Select,
  SlidePanel,
  Textarea,
} from '@/shared/ui'
import { appointmentErrorMessage, appointmentErrors } from '../api/appointmentErrors'
import { getAvailability } from '../api/appointmentsApi'
import { useCreateAppointment, useRescheduleAppointment } from '../hooks/useAppointmentMutations'
import { useAvailabilityQuery } from '../hooks/useAvailabilityQuery'
import { partyLabel, typeLabel } from '../lib/appointmentLabels'
import { toCreateRequest, toRescheduleRequest } from '../lib/appointmentRequest'
import { isSelectable, slotOptions } from '../lib/slotOptions'
import type { Appointment, AppointmentType, AppointmentWriteValues, PartyRef } from '../types'
import { DayStrip } from './DayStrip'
import { SlotPicker } from './SlotPicker'
import { TypeCards } from './TypeCards'
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
  ownerOfPatient?: (patientId: string) => Promise<PartyRef>
}

const TYPES: AppointmentType[] = ['first_visit', 'checkup', 'blood_draw', 'surgery']
const CLIENT_TYPES = TYPES.filter((type) => type !== 'surgery')
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

type OwnerLookup = 'idle' | 'loading' | 'failed'
type FreeDaySearch = 'idle' | 'searching' | 'none' | 'failed'

const FREE_DAY_SEARCH_DAYS = 14

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
  ownerOfPatient,
}: AppointmentFormPanelProps) {
  const [submitError, setSubmitError] = useState<string | undefined>(undefined)
  const [ownerLookup, setOwnerLookup] = useState<OwnerLookup>('idle')
  const lookedUpPatient = useRef<string | null>(null)
  const [freeDaySearch, setFreeDaySearch] = useState<FreeDaySearch>('idle')
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
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentWriteValues>({
    defaultValues: buildDefaults(mode, appointment, initialDate, initialStartsAt),
  })

  const date = watch('date')
  const type = watch('type')
  const durationMinutes = watch('durationMinutes')
  const startsAt = watch('startsAt')
  const patient = watch('patient')
  const owner = watch('owner')
  const isReschedule = mode === 'reschedule'
  const isClient = variant === 'client'
  const isSurgery = !isClient && type === 'surgery'
  const ownerFromPatient = Boolean(ownerOfPatient && patient)

  useEffect(() => {
    if (open) {
      reset(buildDefaults(mode, appointment, initialDate, initialStartsAt))
      setSubmitError(undefined)
      setOwnerLookup('idle')
      lookedUpPatient.current = null
    }
  }, [open, mode, appointment, initialDate, initialStartsAt, reset])

  useEffect(() => {
    if (!isSurgery && durationMinutes !== 30) {
      setValue('durationMinutes', 30)
    }
  }, [isSurgery, durationMinutes, setValue])

  useEffect(() => {
    setFreeDaySearch('idle')
  }, [date])

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
      return all
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

  async function goToNextFreeDay() {
    setFreeDaySearch('searching')
    try {
      const slots = await getAvailability(
        clinicUpcomingDaysRange(FREE_DAY_SEARCH_DAYS, addClinicDays(date, 1)),
        isSurgery ? durationMinutes : undefined,
      )
      const free = slotOptions(slots, isReschedule ? appointment : undefined, Date.now()).find(
        (option) => !option.disabled,
      )
      if (!free) {
        setFreeDaySearch('none')
        return
      }
      setValue('date', clinicDateOf(free.value))
      setValue('startsAt', free.value)
      clearErrors('startsAt')
    } catch {
      setFreeDaySearch('failed')
    }
  }

  function choosePatient(next: PartyRef | null, onChange: (value: PartyRef | null) => void) {
    onChange(next)
    clearErrors('patient')
    if (!ownerOfPatient) return

    lookedUpPatient.current = next?.id ?? null
    setValue('owner', null)
    clearErrors('owner')
    if (!next) {
      setOwnerLookup('idle')
      return
    }

    setOwnerLookup('loading')
    ownerOfPatient(next.id)
      .then((found) => {
        if (lookedUpPatient.current !== next.id) return
        setValue('owner', found)
        setOwnerLookup('idle')
      })
      .catch(() => {
        if (lookedUpPatient.current === next.id) setOwnerLookup('failed')
      })
  }

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
  const durationField = isSurgery && (
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
  )
  const title = isReschedule
    ? isClient || !appointment
      ? 'Move your visit'
      : `Move ${partyLabel(appointment)}`
    : isClient
      ? 'Book a visit'
      : 'New appointment'
  const noSlots = availabilityQuery.isSuccess && options.every((option) => option.disabled)

  return (
    <SlidePanel
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      subtitle={
        isReschedule ? 'Pick a new date and time.' : 'Pick a free slot and fill in the details.'
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
      <DetailSection>
        <form id="appointment-form" onSubmit={submit} className={layout.stack}>
          {isReschedule && appointment && (
            <div className={styles.summaryGrid}>
              <Summary label="Type" value={typeLabel(appointment.type)} />
              <Summary label="Patient" value={appointment.patientName ?? 'No patient yet'} />
              <Summary label="Owner" value={appointment.ownerName ?? 'No owner yet'} />
            </div>
          )}

          <Controller
            name="date"
            control={control}
            rules={{ required: 'Pick a date' }}
            render={({ field }) => (
              <div className={layout.stackTight}>
                <DatePicker
                  id="appointment-date"
                  label="Date *"
                  value={field.value}
                  onChange={field.onChange}
                  minDate={clinicToday()}
                  error={errors.date?.message}
                />
                {field.value && (
                  <DayStrip
                    date={field.value}
                    onSelect={field.onChange}
                    minDate={clinicToday()}
                    label="Days of the week"
                  />
                )}
              </div>
            )}
          />
          <Controller
            name="startsAt"
            control={control}
            rules={{
              required: 'Pick a start time',
              validate: (value) =>
                !value || Date.parse(value) > Date.now() ? true : 'Pick a start time in the future',
            }}
            render={({ field }) =>
              options.length > 0 || availabilityQuery.isLoading ? (
                <SlotPicker
                  label="Start time *"
                  options={options}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.startsAt?.message}
                  isLoading={availabilityQuery.isLoading}
                />
              ) : (
                <>{errors.startsAt && <FormError message={errors.startsAt.message} />}</>
              )
            }
          />

          {noSlots && (
            <div className={styles.noSlots}>
              <p className={styles.noSlotsText} role="status">
                {freeDaySearch === 'none'
                  ? `No free time in the next ${FREE_DAY_SEARCH_DAYS} days.`
                  : freeDaySearch === 'failed'
                    ? 'Could not look for a free day. Try again.'
                    : `No free time left on ${formatDisplayDate(date)}.`}
              </p>
              <Button
                variant="outline"
                type="button"
                className={styles.noSlotsButton}
                disabled={freeDaySearch === 'searching'}
                onClick={() => void goToNextFreeDay()}
              >
                Next free day
              </Button>
            </div>
          )}

          {!isReschedule && (
            <>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <TypeCards
                    value={field.value}
                    onChange={field.onChange}
                    types={isClient ? CLIENT_TYPES : TYPES}
                  />
                )}
              />
              {durationField}
            </>
          )}

          {isReschedule && durationField}

          {!isReschedule && (
            <>
              {patientField && (
                <Controller
                  name="patient"
                  control={control}
                  render={({ field }) =>
                    patientField({
                      value: field.value,
                      onChange: (next) => choosePatient(next, field.onChange),
                      error: errors.patient?.message,
                    })
                  }
                />
              )}
              {ownerFromPatient && (
                <div className={styles.lockedField}>
                  <span className={fieldStyles.label} id="appointment-owner-label">
                    Owner
                  </span>
                  <div
                    className={styles.lockedValue}
                    role="status"
                    aria-labelledby="appointment-owner-label"
                  >
                    {ownerLookup === 'loading'
                      ? 'Finding the owner…'
                      : ownerLookup === 'failed'
                        ? "The owner on the patient's card is used when you book."
                        : (owner?.label ?? '')}
                  </div>
                  <p className={styles.lockedHint}>Taken from the patient's card.</p>
                </div>
              )}
              {ownerField && !ownerFromPatient && (
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

          <FormError message={submitError} />
        </form>
      </DetailSection>
    </SlidePanel>
  )
}
