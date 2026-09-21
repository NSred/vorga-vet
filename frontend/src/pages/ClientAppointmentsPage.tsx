import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { Badge, Button, ConfirmDialog, EmptyState, Skeleton, Textarea, useToast } from '@/shared/ui'
import { isApiErrorCode } from '@/shared/lib/apiClient'
import {
  addClinicDays,
  clinicDateOf,
  clinicRecentDaysRange,
  clinicTimeOf,
  clinicToday,
  clinicUpcomingDaysRange,
} from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import {
  appointmentErrorMessage,
  appointmentErrors,
  AppointmentFormPanel,
  appointmentKeys,
  canReschedule,
  canTransition,
  isOpen,
  statusLabel,
  statusTone,
  typeLabel,
  useAppointmentsQuery,
  useCancelAppointment,
} from '@/features/appointments'
import type { Appointment, PartyField } from '@/features/appointments'
import { patientLabel, PatientPicker, usePatientsQuery } from '@/features/patients'
import type { PatientListItem } from '@/features/patients'
import styles from './ClientAppointmentsPage.module.css'

const WINDOW_DAYS = 62

function byStartAscending(a: Appointment, b: Appointment): number {
  return a.startsAt.localeCompare(b.startsAt)
}

function VisitRow({
  appointment,
  onReschedule,
  onCancel,
}: {
  appointment: Appointment
  onReschedule?: () => void
  onCancel?: () => void
}) {
  const dateIso = clinicDateOf(appointment.startsAt)

  return (
    <li className={styles.row}>
      <div className={styles.rowMain}>
        <span className={styles.when}>
          {formatDisplayDate(dateIso)} · {clinicTimeOf(appointment.startsAt)}
        </span>
        <span className={styles.what}>
          {typeLabel(appointment.type)}
          {appointment.patientName ? ` · ${appointment.patientName}` : ''}
        </span>
      </div>
      <div className={styles.rowSide}>
        <Badge tone={statusTone(appointment.status)}>{statusLabel(appointment.status)}</Badge>
        {onReschedule && (
          <Button variant="outline" type="button" onClick={onReschedule}>
            Reschedule
          </Button>
        )}
        {onCancel && (
          <Button variant="danger" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </li>
  )
}

export function ClientAppointmentsPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const cancel = useCancelAppointment()
  const patientCache = useRef(new Map<string, PatientListItem>())

  const [booking, setBooking] = useState(false)
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null)
  const [cancelling, setCancelling] = useState<Appointment | null>(null)
  const [reason, setReason] = useState('')

  const today = clinicToday()
  const upcomingRange = useMemo(() => clinicUpcomingDaysRange(WINDOW_DAYS, today), [today])
  const pastRange = useMemo(
    () => clinicRecentDaysRange(WINDOW_DAYS, addClinicDays(today, -1)),
    [today],
  )

  const upcomingQuery = useAppointmentsQuery(upcomingRange)
  const pastQuery = useAppointmentsQuery(pastRange)
  const patientsQuery = usePatientsQuery({ status: 'active' }, 1, 20, true)

  const isPending = upcomingQuery.isPending || pastQuery.isPending
  const hasError = upcomingQuery.isError && pastQuery.isError

  const { open, closed } = useMemo(() => {
    const all = [...(upcomingQuery.data ?? []), ...(pastQuery.data ?? [])]

    return {
      open: all.filter(isOpen).sort(byStartAscending),
      closed: all
        .filter((appointment) => !isOpen(appointment))
        .sort((a, b) => byStartAscending(b, a)),
    }
  }, [upcomingQuery.data, pastQuery.data])

  const myPatients = patientsQuery.data?.items ?? []
  const hasPatients = myPatients.length > 0

  const patientField = (field: PartyField) =>
    hasPatients ? (
      <PatientPicker
        value={field.value ? (patientCache.current.get(field.value.id) ?? null) : null}
        onChange={(patient) => {
          if (patient) patientCache.current.set(patient.id, patient)
          field.onChange(patient ? { id: patient.id, label: patientLabel(patient) } : null)
        }}
        error={field.error}
      />
    ) : (
      <p className={styles.note}>
        The clinic will match this booking to your animal when you arrive.
      </p>
    )

  const closeForms = () => {
    setBooking(false)
    setRescheduling(null)
  }

  const confirmCancel = () => {
    if (!cancelling) return

    cancel.mutate(
      { id: cancelling.id, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          setCancelling(null)
          showToast({ tone: 'success', title: 'Visit cancelled' })
        },
        onError: (error) => {
          setCancelling(null)

          // It was already gone; the refreshed list is the whole answer.
          if (isApiErrorCode(error, appointmentErrors.notFound)) {
            void queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
            return
          }

          showToast({
            tone: 'error',
            title: appointmentErrorMessage(error, 'Could not cancel that visit.'),
          })
        },
      },
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Your visits</h1>
          <p className={styles.subtitle}>Book a visit and see the ones you already have.</p>
        </div>
        <Button variant="primary" type="button" onClick={() => setBooking(true)}>
          ＋ Book a visit
        </Button>
      </div>

      {hasError ? (
        <EmptyState message="Your visits could not be loaded." />
      ) : (
        <>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Upcoming</h2>
            {isPending ? (
              <Skeleton height="4rem" />
            ) : open.length === 0 ? (
              <EmptyState message="You have no upcoming visits." />
            ) : (
              <ul className={styles.list}>
                {open.map((appointment) => (
                  <VisitRow
                    key={appointment.id}
                    appointment={appointment}
                    onReschedule={
                      canReschedule(appointment.status)
                        ? () => setRescheduling(appointment)
                        : undefined
                    }
                    onCancel={
                      canTransition(appointment.status, 'cancelled')
                        ? () => {
                            setReason('')
                            setCancelling(appointment)
                          }
                        : undefined
                    }
                  />
                ))}
              </ul>
            )}
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Past</h2>
            {isPending ? (
              <Skeleton height="4rem" />
            ) : closed.length === 0 ? (
              <EmptyState message="No past visits yet." />
            ) : (
              <ul className={styles.list}>
                {closed.map((appointment) => (
                  <VisitRow key={appointment.id} appointment={appointment} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {booking && (
        <AppointmentFormPanel
          mode="create"
          variant="client"
          initialDate={today}
          open
          onOpenChange={(next) => !next && closeForms()}
          onSaved={() => {
            closeForms()
            showToast({ tone: 'success', title: 'Visit booked' })
          }}
          patientField={patientField}
        />
      )}

      {rescheduling && (
        <AppointmentFormPanel
          mode="reschedule"
          variant="client"
          appointment={rescheduling}
          initialDate={clinicDateOf(rescheduling.startsAt)}
          open
          onOpenChange={(next) => !next && closeForms()}
          onSaved={() => {
            closeForms()
            showToast({ tone: 'success', title: 'Visit moved' })
          }}
        />
      )}

      <ConfirmDialog
        open={cancelling !== null}
        onOpenChange={(next) => !next && setCancelling(null)}
        title="Cancel this visit?"
        description="The time is freed for someone else. You can book a new visit afterwards."
        confirmLabel="Cancel visit"
        tone="danger"
        isPending={cancel.isPending}
        onConfirm={confirmCancel}
      >
        <Textarea
          id="cancel-reason"
          label="Reason (optional)"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </ConfirmDialog>
    </div>
  )
}
