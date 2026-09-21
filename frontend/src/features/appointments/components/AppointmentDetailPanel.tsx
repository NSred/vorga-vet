import type { ReactNode } from 'react'
import { Badge, Button, SlidePanel } from '@/shared/ui'
import { clinicDateOf, clinicTimeOf } from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { partyLabel, statusLabel, statusTone, typeLabel } from '../lib/appointmentLabels'
import { WEEKDAYS } from '../lib/dateHelpers'
import type { Appointment } from '../types'
import styles from './AppointmentDetailPanel.module.css'

export interface AppointmentDetailPanelProps {
  appointment: Appointment
  open: boolean
  onOpenChange: (open: boolean) => void
  patientSection: ReactNode
  onOpenPatientRecord?: () => void
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value}</span>
    </div>
  )
}

function weekdayOf(dateIso: string): string {
  const [year, month, day] = dateIso.split('-').map(Number)

  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
}

export function AppointmentDetailPanel({
  appointment,
  open,
  onOpenChange,
  patientSection,
  onOpenPatientRecord,
}: AppointmentDetailPanelProps) {
  const dateIso = clinicDateOf(appointment.startsAt)
  const timeRange = `${clinicTimeOf(appointment.startsAt)}–${clinicTimeOf(appointment.endsAt)}`

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
              {weekdayOf(dateIso)}, {formatDisplayDate(dateIso)} · {timeRange}
            </div>
          </div>
        </div>
      }
      footer={
        onOpenPatientRecord ? (
          <Button variant="outline" type="button" onClick={onOpenPatientRecord}>
            Patient record
          </Button>
        ) : null
      }
    >
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Appointment</h3>
        <div className={styles.grid}>
          <Field label="Date" value={formatDisplayDate(dateIso)} />
          <Field label="Time" value={timeRange} />
          <Field label="Duration" value={`${appointment.durationMinutes} min`} />
          <Field label="Type" value={typeLabel(appointment.type)} />
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Status</span>
            <span className={styles.fieldValue}>
              <Badge tone={statusTone(appointment.status)}>{statusLabel(appointment.status)}</Badge>
            </span>
          </div>
          <Field label="Created" value={formatDisplayDate(clinicDateOf(appointment.createdAt))} />
          <Field label="Reason" value={appointment.reason ?? '—'} />
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Patient</h3>
        {patientSection}
      </section>
    </SlidePanel>
  )
}
