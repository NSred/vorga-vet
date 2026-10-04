import { useState } from 'react'
import { clinicDateOf, clinicTimeOf } from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { Badge, Button, useToast } from '@/shared/ui'
import { examinationErrorMessage } from '../api/examinationErrors'
import { usePayExamination } from '../hooks/useExaminationMutations'
import type { Examination } from '../types'
import { AttachmentStrip } from './AttachmentStrip'
import styles from './ExaminationCard.module.css'

export interface ExaminationCardProps {
  examination: Examination
  onEdit?: (examination: Examination) => void
}

const CLAMP_AT = 180

function ClinicalField({ label, value }: { label: string; value?: string }) {
  const [expanded, setExpanded] = useState(false)

  if (!value) return null

  const isLong = value.length > CLAMP_AT

  return (
    <div className={styles.clinical}>
      <span className={styles.clinicalLabel}>{label}</span>
      <p className={isLong && !expanded ? styles.clamped : styles.text}>{value}</p>
      {isLong && (
        <button type="button" className={styles.toggle} onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}

export function ExaminationCard({ examination, onEdit }: ExaminationCardProps) {
  const { showToast } = useToast()
  const pay = usePayExamination()

  const dateIso = clinicDateOf(examination.startedAt)
  const performer = `${examination.performedByFirstName} ${examination.performedByLastName}`.trim()
  const hasCost = examination.cost !== undefined
  const canPay = hasCost && !examination.isPaid

  const markPaid = () => {
    pay.mutate(examination.id, {
      onSuccess: () => showToast({ tone: 'success', title: 'Marked as paid' }),
      onError: (error) =>
        showToast({
          tone: 'error',
          title: examinationErrorMessage(error, 'Could not mark the examination as paid.'),
        }),
    })
  }

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div>
          <div className={styles.when}>
            {formatDisplayDate(dateIso)} · {clinicTimeOf(examination.startedAt)}
          </div>
          <div className={styles.who}>
            {performer} · {examination.appointmentId ? 'Appointment' : 'Walk-in'}
          </div>
        </div>
        <Badge tone={examination.isPaid ? 'ok' : hasCost ? 'warn' : 'neutral'}>
          {examination.isPaid ? 'Paid' : hasCost ? 'Unpaid' : 'No cost'}
        </Badge>
      </header>

      <ClinicalField label="Anamnesis" value={examination.anamnesis} />
      <ClinicalField label="Diagnosis" value={examination.diagnosis} />
      <ClinicalField label="Therapy" value={examination.therapy} />

      <AttachmentStrip examinationId={examination.id} attachments={examination.attachments} />

      <footer className={styles.footer}>
        <span className={styles.cost}>
          {hasCost ? `${examination.cost?.toFixed(2)}` : 'No cost recorded'}
        </span>
        <div className={styles.actions}>
          {canPay && (
            <Button variant="outline" type="button" disabled={pay.isPending} onClick={markPaid}>
              Mark as paid
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" type="button" onClick={() => onEdit(examination)}>
              ✎ Edit
            </Button>
          )}
        </div>
      </footer>
    </article>
  )
}
