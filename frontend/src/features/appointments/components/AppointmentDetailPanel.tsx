import type { ReactNode } from 'react'
import { Badge, Button, DetailSection, Field, FieldGrid, SlidePanel } from '@/shared/ui'
import { clinicDateOf, clinicTimeOf, weekdayName } from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { partyLabel, statusLabel, statusTone, typeLabel } from '../lib/appointmentLabels'
import { canReschedule, canTransition } from '../lib/appointmentTransitions'
import type { Appointment } from '../types'
import styles from './AppointmentDetailPanel.module.css'

export interface AppointmentDetailPanelProps {
  appointment: Appointment
  open: boolean
  onOpenChange: (open: boolean) => void
  patientSection: ReactNode
  onOpenPatientRecord?: () => void
  onReschedule?: () => void
  onCancel?: () => void
  onNoShow?: () => void
  onCheckIn?: () => void
  onComplete?: () => void
}

function hasStarted(appointment: Appointment): boolean {
  return Date.parse(appointment.startsAt) < Date.now()
}

export function AppointmentDetailPanel({
  appointment,
  open,
  onOpenChange,
  patientSection,
  onOpenPatientRecord,
  onReschedule,
  onCancel,
  onNoShow,
  onCheckIn,
  onComplete,
}: AppointmentDetailPanelProps) {
  const dateIso = clinicDateOf(appointment.startsAt)
  const timeRange = `${clinicTimeOf(appointment.startsAt)}–${clinicTimeOf(appointment.endsAt)}`
  const showReschedule = onReschedule && canReschedule(appointment.status)
  const showCancel = onCancel && canTransition(appointment.status, 'cancelled')
  const showNoShow =
    onNoShow && canTransition(appointment.status, 'no_show') && hasStarted(appointment)
  const showCheckIn = onCheckIn && canTransition(appointment.status, 'checked_in')
  const showComplete = onComplete && canTransition(appointment.status, 'completed')
  const hasFooter =
    showReschedule || showCancel || showNoShow || showCheckIn || showComplete || onOpenPatientRecord

  return (
    <SlidePanel
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel={`Appointment for ${partyLabel(appointment)}`}
      headerTone="accent"
      header={
        <div className={styles.header}>
          <span className={styles.icon}>📅</span>
          <div>
            <div className={styles.title}>{partyLabel(appointment)}</div>
            <div className={styles.subtitle}>
              {weekdayName(dateIso)}, {formatDisplayDate(dateIso)} · {timeRange}
            </div>
          </div>
        </div>
      }
      footer={
        hasFooter ? (
          <>
            {showComplete && (
              <Button variant="primary" type="button" onClick={onComplete}>
                Complete visit
              </Button>
            )}
            {showCheckIn && (
              <Button variant="primary" type="button" onClick={onCheckIn}>
                Check in
              </Button>
            )}
            {showNoShow && (
              <Button variant="danger" type="button" onClick={onNoShow}>
                No-show
              </Button>
            )}
            {showCancel && (
              <Button variant="danger" type="button" onClick={onCancel}>
                Cancel appointment
              </Button>
            )}
            {showReschedule && (
              <Button variant="outline" type="button" onClick={onReschedule}>
                Reschedule
              </Button>
            )}
            {onOpenPatientRecord && (
              <Button variant="outline" type="button" onClick={onOpenPatientRecord}>
                Patient record
              </Button>
            )}
          </>
        ) : null
      }
    >
      <DetailSection title="Appointment">
        <FieldGrid>
          <Field label="Date" value={formatDisplayDate(dateIso)} />
          <Field label="Time" value={timeRange} />
          <Field label="Duration" value={`${appointment.durationMinutes} min`} />
          <Field label="Type" value={typeLabel(appointment.type)} />
          <Field
            label="Status"
            value={
              <Badge tone={statusTone(appointment.status)}>{statusLabel(appointment.status)}</Badge>
            }
          />
          <Field label="Created" value={formatDisplayDate(clinicDateOf(appointment.createdAt))} />
          <Field label="Reason" value={appointment.reason} />
        </FieldGrid>
      </DetailSection>

      <DetailSection title="Patient">{patientSection}</DetailSection>
    </SlidePanel>
  )
}
