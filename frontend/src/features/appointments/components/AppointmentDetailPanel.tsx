import type { ReactNode } from 'react'
import {
  Badge,
  Button,
  DetailSection,
  EntityHeader,
  Field,
  FieldGrid,
  SlidePanel,
} from '@/shared/ui'
import { clinicDateOf, clinicTimeOf, weekdayName } from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { partyLabel, typeLabel, typeTone } from '../lib/appointmentLabels'
import { canReschedule, canTransition } from '../lib/appointmentTransitions'
import type { Appointment } from '../types'
import { AppointmentStepper } from './AppointmentStepper'
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
  const timeRange = `${clinicTimeOf(appointment.startsAt)} – ${clinicTimeOf(appointment.endsAt)}`
  const showReschedule = onReschedule && canReschedule(appointment.status)
  const showCancel = onCancel && canTransition(appointment.status, 'cancelled')
  const showNoShow =
    onNoShow && canTransition(appointment.status, 'no_show') && hasStarted(appointment)
  const showCheckIn = onCheckIn && canTransition(appointment.status, 'checked_in')
  const showComplete = onComplete && canTransition(appointment.status, 'completed')
  const primary = showCheckIn
    ? { label: 'Check in', onClick: onCheckIn }
    : showComplete && appointment.status === 'checked_in'
      ? { label: 'Complete visit', onClick: onComplete }
      : null
  const showDirectComplete = showComplete && appointment.status === 'scheduled'
  const hasSecondary = showDirectComplete || showReschedule || showNoShow || showCancel
  const hasFooter = Boolean(primary) || hasSecondary

  return (
    <SlidePanel
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel={`Appointment for ${partyLabel(appointment)}`}
      headerTone="accent"
      header={
        <EntityHeader
          eyebrow={<Badge tone={typeTone(appointment.type)}>{typeLabel(appointment.type)}</Badge>}
          title={timeRange}
          subtitle={`${weekdayName(dateIso)}, ${formatDisplayDate(dateIso)} · ${appointment.durationMinutes} min`}
          chips={<AppointmentStepper appointment={appointment} />}
        />
      }
      footer={
        hasFooter ? (
          <div className={styles.actions}>
            {primary && (
              <Button
                variant="primary"
                type="button"
                className={styles.primary}
                onClick={primary.onClick}
              >
                {primary.label}
              </Button>
            )}
            {hasSecondary && (
              <div className={styles.secondary}>
                {showDirectComplete && (
                  <Button variant="outline" type="button" onClick={onComplete}>
                    Complete visit
                  </Button>
                )}
                {showReschedule && (
                  <Button variant="outline" type="button" onClick={onReschedule}>
                    Reschedule
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
              </div>
            )}
          </div>
        ) : null
      }
    >
      <DetailSection
        title="Patient"
        action={
          onOpenPatientRecord && (
            <Button variant="soft" type="button" onClick={onOpenPatientRecord}>
              Open record ›
            </Button>
          )
        }
      >
        {patientSection}
      </DetailSection>

      <DetailSection title="Appointment">
        <FieldGrid>
          <Field label="Party" value={partyLabel(appointment)} />
          <Field label="Created" value={formatDisplayDate(clinicDateOf(appointment.createdAt))} />
        </FieldGrid>
        <Field label="Reason" value={appointment.reason} />
      </DetailSection>
    </SlidePanel>
  )
}
