import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ConfirmDialog, EmptyState, Textarea, useToast } from '@/shared/ui'
import {
  addClinicDays,
  addClinicMonths,
  addClinicWeeks,
  clinicDateOf,
  clinicDayRange,
  clinicMonthGridRange,
  clinicToday,
  clinicWeekRange,
} from '@/shared/lib/clinicTime'
import {
  AppointmentDetailPanel,
  appointmentErrorMessage,
  AppointmentFormPanel,
  CalendarToolbar,
  DayView,
  isVisible,
  MonthView,
  parseViewParams,
  toViewParams,
  UnresolvedBanner,
  UnresolvedPanel,
  useAppointmentQuery,
  useAppointmentsQuery,
  useAvailabilityQuery,
  useCancelAppointment,
  useMarkNoShow,
  WeekView,
} from '@/features/appointments'
import type {
  Appointment,
  AppointmentViewState,
  CalendarView,
  PartyField,
} from '@/features/appointments'
import {
  ownerLabel,
  OwnerPicker,
  patientLabel,
  PatientPicker,
  PatientSummary,
} from '@/features/patients'
import type { OwnerOption, PatientListItem } from '@/features/patients'
import styles from './AppointmentsPage.module.css'

type FormState =
  | { mode: 'closed' }
  | { mode: 'create'; date: string; startsAt?: string }
  | { mode: 'reschedule'; appointment: Appointment }

type ActionState = { kind: 'cancel' | 'no_show'; appointment: Appointment } | null

const ACTION_COPY = {
  cancel: {
    title: 'Cancel this appointment?',
    description: 'The slot is freed and the appointment stays in the history as cancelled.',
    confirmLabel: 'Cancel appointment',
    noteLabel: 'Reason (optional)',
    success: 'Appointment cancelled',
  },
  no_show: {
    title: 'Mark as no-show?',
    description: 'Use this when the animal did not come to the appointment.',
    confirmLabel: 'Mark no-show',
    noteLabel: 'Note (optional)',
    success: 'Marked as no-show',
  },
} as const

export function AppointmentsPage() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({ mode: 'closed' })
  const [action, setAction] = useState<ActionState>(null)
  const [note, setNote] = useState('')
  const [unresolvedOpen, setUnresolvedOpen] = useState(false)
  const ownerCache = useRef(new Map<string, OwnerOption>())
  const patientCache = useRef(new Map<string, PatientListItem>())
  const cancel = useCancelAppointment()
  const noShow = useMarkNoShow()

  const { view, date: currentDate, showCancelled } = parseViewParams(searchParams, clinicToday())

  const writeParams = useCallback(
    (next: Partial<AppointmentViewState>) => {
      const current = parseViewParams(searchParams, clinicToday())
      setSearchParams(toViewParams({ ...current, ...next }), { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const setView = (next: CalendarView) => writeParams({ view: next })
  const setCurrentDate = (next: string) => writeParams({ date: next })
  const setShowCancelled = (next: boolean) => writeParams({ showCancelled: next })

  const range = useMemo(() => {
    if (view === 'day') return clinicDayRange(currentDate)
    if (view === 'week') return clinicWeekRange(currentDate)
    return clinicMonthGridRange(currentDate)
  }, [view, currentDate])

  const appointmentsQuery = useAppointmentsQuery(range)
  const availabilityQuery = useAvailabilityQuery(range)

  const visible = useMemo(
    () => (appointmentsQuery.data ?? []).filter((item) => isVisible(item, showCancelled)),
    [appointmentsQuery.data, showCancelled],
  )

  const inRange = appointmentsQuery.data?.find((item) => item.id === selectedId) ?? null
  const detailQuery = useAppointmentQuery(selectedId, inRange === null)
  const selected =
    inRange ?? (detailQuery.data && detailQuery.data.id === selectedId ? detailQuery.data : null)
  const hasError = appointmentsQuery.isError
  const isLoading = appointmentsQuery.isLoading || availabilityQuery.isLoading
  const slots = availabilityQuery.data ?? []
  const hasSlotData = availabilityQuery.isSuccess

  const handlePrev = () => {
    if (view === 'day') setCurrentDate(addClinicDays(currentDate, -1))
    else if (view === 'week') setCurrentDate(addClinicWeeks(currentDate, -1))
    else setCurrentDate(addClinicMonths(currentDate, -1))
  }

  const handleNext = () => {
    if (view === 'day') setCurrentDate(addClinicDays(currentDate, 1))
    else if (view === 'week') setCurrentDate(addClinicWeeks(currentDate, 1))
    else setCurrentDate(addClinicMonths(currentDate, 1))
  }

  const openDay = (dateIso: string) => {
    setCurrentDate(dateIso)
    setView('day')
  }

  const closeForm = () => setForm({ mode: 'closed' })

  const afterSave = (title: string) => {
    closeForm()
    showToast({ tone: 'success', title })
  }

  const openAction = (kind: 'cancel' | 'no_show', appointment: Appointment) => {
    setNote('')
    setAction({ kind, appointment })
  }

  const confirmAction = () => {
    if (!action) return

    const id = action.appointment.id
    const trimmedNote = note.trim() || undefined
    const settle = () => setAction(null)
    const succeed = () => {
      settle()
      showToast({ tone: 'success', title: ACTION_COPY[action.kind].success })
    }
    const fail = (error: unknown) => {
      settle()
      showToast({
        tone: 'error',
        title: appointmentErrorMessage(error, 'Could not update the appointment.'),
      })
    }

    if (action.kind === 'cancel') {
      cancel.mutate({ id, reason: trimmedNote }, { onSuccess: succeed, onError: fail })
    } else {
      noShow.mutate({ id, note: trimmedNote }, { onSuccess: succeed, onError: fail })
    }
  }

  const ownerField = (field: PartyField) => (
    <OwnerPicker
      value={field.value ? (ownerCache.current.get(field.value.id) ?? null) : null}
      onChange={(owner) => {
        ownerCache.current.set(owner.id, owner)
        field.onChange({ id: owner.id, label: ownerLabel(owner) })
      }}
      error={field.error}
    />
  )

  const patientField = (field: PartyField) => (
    <PatientPicker
      value={field.value ? (patientCache.current.get(field.value.id) ?? null) : null}
      onChange={(patient) => {
        if (patient) patientCache.current.set(patient.id, patient)
        field.onChange(patient ? { id: patient.id, label: patientLabel(patient) } : null)
      }}
      error={field.error}
    />
  )

  const actionCopy = action ? ACTION_COPY[action.kind] : null

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Appointments</h1>
          <p className={styles.subtitle}>Appointment calendar — day, week, and month view.</p>
        </div>
      </div>

      <UnresolvedBanner onOpen={() => setUnresolvedOpen(true)} />

      <CalendarToolbar
        view={view}
        onViewChange={setView}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={() => setCurrentDate(clinicToday())}
        showCancelled={showCancelled}
        onShowCancelledChange={setShowCancelled}
        onNewAppointment={() => setForm({ mode: 'create', date: currentDate })}
      />

      {hasError ? (
        <EmptyState message="Appointments could not be loaded." />
      ) : (
        <>
          {view === 'day' && (
            <DayView
              date={currentDate}
              slots={slots}
              appointments={visible}
              onAppointmentClick={(appointment) => setSelectedId(appointment.id)}
              onSlotClick={(startsAt) =>
                setForm({ mode: 'create', date: clinicDateOf(startsAt), startsAt })
              }
              isLoading={isLoading}
              hasSlotData={hasSlotData}
            />
          )}
          {view === 'week' && (
            <WeekView
              date={currentDate}
              appointments={visible}
              slots={slots}
              onAppointmentClick={(appointment) => setSelectedId(appointment.id)}
              onDateSelect={openDay}
              isLoading={isLoading}
              hasSlotData={hasSlotData}
            />
          )}
          {view === 'month' && (
            <MonthView
              date={currentDate}
              appointments={visible}
              slots={slots}
              onAppointmentClick={(appointment) => setSelectedId(appointment.id)}
              onDateSelect={openDay}
              isLoading={isLoading}
              hasSlotData={hasSlotData}
            />
          )}
        </>
      )}

      {selected !== null && (
        <AppointmentDetailPanel
          appointment={selected}
          open
          onOpenChange={(open) => !open && setSelectedId(null)}
          patientSection={
            selected.patientId ? (
              <PatientSummary patientId={selected.patientId} />
            ) : (
              <div className={styles.unresolved}>
                <p>Patient not yet assigned — resolved at check-in.</p>
                <p>{selected.ownerName ?? 'Owner not yet assigned'}</p>
              </div>
            )
          }
          onOpenPatientRecord={
            selected.patientId
              ? () => navigate(`/patients?patient=${selected.patientId}`)
              : undefined
          }
          onReschedule={() => setForm({ mode: 'reschedule', appointment: selected })}
          onCancel={() => openAction('cancel', selected)}
          onNoShow={() => openAction('no_show', selected)}
        />
      )}

      {form.mode === 'create' && (
        <AppointmentFormPanel
          mode="create"
          initialDate={form.date}
          initialStartsAt={form.startsAt}
          open
          onOpenChange={(open) => !open && closeForm()}
          onSaved={() => afterSave('Appointment booked')}
          ownerField={ownerField}
          patientField={patientField}
        />
      )}

      {form.mode === 'reschedule' && (
        <AppointmentFormPanel
          mode="reschedule"
          appointment={form.appointment}
          initialDate={clinicDateOf(form.appointment.startsAt)}
          open
          onOpenChange={(open) => !open && closeForm()}
          onSaved={() => afterSave('Appointment moved')}
          ownerField={ownerField}
          patientField={patientField}
        />
      )}

      <UnresolvedPanel
        open={unresolvedOpen}
        onOpenChange={setUnresolvedOpen}
        onSelect={(appointment) => {
          setUnresolvedOpen(false)
          setSelectedId(appointment.id)
        }}
      />

      {actionCopy && (
        <ConfirmDialog
          open={action !== null}
          onOpenChange={(open) => !open && setAction(null)}
          title={actionCopy.title}
          description={actionCopy.description}
          confirmLabel={actionCopy.confirmLabel}
          tone="danger"
          isPending={cancel.isPending || noShow.isPending}
          onConfirm={confirmAction}
        >
          <Textarea
            id="action-note"
            label={actionCopy.noteLabel}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </ConfirmDialog>
      )}
    </div>
  )
}
