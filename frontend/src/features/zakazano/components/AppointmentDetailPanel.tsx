import type { ChangeEvent } from 'react'
import { Link } from 'react-router'
import { SPECIES_EMOJI, type Patient } from '@/features/kartoteka'
import { Button, IconButton, SlidePanel } from '@/shared/ui'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { addAttachment, removeAttachment } from '../api/appointmentsApi'
import { formatReminderDate, formatWeekday, getAppointmentStatus } from '../lib/dateHelpers'
import type { Appointment } from '../types'
import styles from './AppointmentDetailPanel.module.css'

export interface AppointmentDetailPanelProps {
  appointment: Appointment
  patient: Patient
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
  onDelete: () => void
  onAppointmentChange: (appointment: Appointment) => void
}

const TYPE_LABELS: Record<Appointment['type'], string> = {
  prvi_pregled: 'Prvi pregled',
  kontrola: 'Kontrola',
  vakcinacija: 'Vakcinacija',
  ostalo: 'Ostalo',
}

const STATUS_LABELS = { zavrsen: 'Završen', danas: 'Danas', predstoji: 'Predstoji' } as const

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value}</span>
    </div>
  )
}

export function AppointmentDetailPanel({
  appointment,
  patient,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onAppointmentChange,
}: AppointmentDetailPanelProps) {
  const status = getAppointmentStatus(appointment.date)

  const handleFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const updated = await addAttachment(appointment.id, file)
    onAppointmentChange(updated)
    event.target.value = ''
  }

  const handleRemoveAttachment = async (attachmentId: string) => {
    const updated = await removeAttachment(appointment.id, attachmentId)
    onAppointmentChange(updated)
  }

  return (
    <SlidePanel
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel={`Termin — ${patient.name} · ${patient.ownerName}`}
      headerTone="warn"
      header={
        <div className={styles.header}>
          <span className={styles.icon}>📅</span>
          <div>
            <div className={styles.title}>
              {patient.name} · {patient.ownerName}
            </div>
            <div className={styles.subtitle}>
              {formatWeekday(appointment.date)}, {formatDisplayDate(appointment.date)} · {appointment.time}
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <Button variant="danger" type="button" onClick={onDelete}>
            Obriši
          </Button>
          <Button variant="outline" type="button" onClick={onEdit}>
            ✎ Izmeni
          </Button>
        </>
      }
    >
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Podaci o terminu</h3>
        <div className={styles.grid}>
          <Field label="Datum" value={formatDisplayDate(appointment.date)} />
          <Field label="Vreme" value={appointment.time} />
          <Field label="Tip termina" value={TYPE_LABELS[appointment.type]} />
          <Field label="Status" value={STATUS_LABELS[status]} />
          <Field label="Dan" value={formatWeekday(appointment.date)} />
          <Field
            label="Podsetnik vlasniku"
            value={appointment.reminderEnabled ? `🔔 dan pre · ${formatReminderDate(appointment.date)}` : 'isključen'}
          />
        </div>
        {appointment.note && <Field label="Intervencija / napomena" value={appointment.note} />}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Nalazi i RTG snimci ({appointment.attachments.length})</h3>
        {appointment.attachments.length === 0 ? (
          <p className={styles.emptyAttachments}>Nema priloženih nalaza za ovaj termin.</p>
        ) : (
          <ul className={styles.attachmentList}>
            {appointment.attachments.map((attachment) => (
              <li key={attachment.id} className={styles.attachmentItem}>
                {attachment.previewUrl ? (
                  <img src={attachment.previewUrl} alt={attachment.fileName} className={styles.attachmentThumb} />
                ) : (
                  <span className={styles.attachmentIcon}>📄</span>
                )}
                <div className={styles.attachmentInfo}>
                  <span className={styles.attachmentName}>{attachment.fileName}</span>
                  <span className={styles.attachmentSize}>{formatFileSize(attachment.fileSizeBytes)}</span>
                </div>
                <IconButton label="Ukloni prilog" onClick={() => handleRemoveAttachment(attachment.id)}>
                  ✕
                </IconButton>
              </li>
            ))}
          </ul>
        )}
        <label className={styles.uploadButton}>
          Dodaj RTG / nalaz — PDF ili slika
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={handleFileInputChange}
            className={styles.hiddenFileInput}
          />
        </label>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Pacijent iz kartoteke</h3>
          <Link to={`/?patient=${patient.id}`} className={styles.cardLink}>
            Otvori karton →
          </Link>
        </div>
        <div className={styles.grid}>
          <Field label="Broj kartona" value={patient.cardNumber} />
          <Field label="Ime" value={`${SPECIES_EMOJI[patient.species]} ${patient.name}`} />
          <Field label="Rasa" value={patient.breed} />
          <Field label="Alergije" value={patient.allergies} />
          <Field label="Telefon" value={patient.phone ?? '—'} />
          <Field label="Vlasnik" value={patient.ownerName} />
        </div>
      </section>
    </SlidePanel>
  )
}
