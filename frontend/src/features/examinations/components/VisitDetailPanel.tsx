import { useState, type ReactNode } from 'react'
import { clinicDateOf, clinicTimeOf } from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { formatPrice } from '@/shared/lib/money'
import { Button, DetailSection, Field, SlidePanel, useToast } from '@/shared/ui'
import { examinationErrorMessage } from '../api/examinationErrors'
import { usePayExamination } from '../hooks/useExaminationMutations'
import { usePatientExaminationsQuery } from '../hooks/usePatientExaminationsQuery'
import { isUnpaid, performerOf, visitOrigin } from '../lib/visitLabels'
import type { Examination } from '../types'
import { AttachmentStrip } from './AttachmentStrip'
import { PaymentBadge } from './PaymentBadge'
import styles from './VisitDetailPanel.module.css'

export interface VisitDetailPanelProps {
  patientId: string
  visitId: string | null
  onClose: () => void
  onEdit: (examination: Examination) => void
  renderCharges?: (examination: Examination) => ReactNode
}

function text(value?: string) {
  return value ? <span className={styles.text}>{value}</span> : undefined
}

export function VisitDetailPanel({
  patientId,
  visitId,
  onClose,
  onEdit,
  renderCharges,
}: VisitDetailPanelProps) {
  const { showToast } = useToast()
  const pay = usePayExamination()
  const { data } = usePatientExaminationsQuery(patientId, visitId !== null)
  const [shown, setShown] = useState<Examination | null>(null)

  const current = visitId === null ? undefined : data?.find((visit) => visit.id === visitId)
  if (current && current !== shown) {
    setShown(current)
  }

  if (!shown) return null

  const dateIso = clinicDateOf(shown.startedAt)

  const markPaid = () => {
    pay.mutate(shown.id, {
      onSuccess: () => showToast({ tone: 'success', title: 'Marked as paid' }),
      onError: (error) =>
        showToast({
          tone: 'error',
          title: examinationErrorMessage(error, 'Could not mark the examination as paid.'),
        }),
    })
  }

  return (
    <SlidePanel
      open={current !== undefined}
      onOpenChange={(open) => !open && onClose()}
      title={`Visit ${formatDisplayDate(dateIso)} · ${clinicTimeOf(shown.startedAt)}`}
      ariaLabel={`Visit of ${formatDisplayDate(dateIso)}`}
      subtitle={`${performerOf(shown)} · ${visitOrigin(shown)}`}
      badge={<PaymentBadge examination={shown} />}
      footer={
        <>
          {isUnpaid(shown) && (
            <Button variant="outline" type="button" disabled={pay.isPending} onClick={markPaid}>
              Mark as paid
            </Button>
          )}
          <Button variant="primary" type="button" onClick={() => onEdit(shown)}>
            ✎ Edit
          </Button>
        </>
      }
    >
      <DetailSection title="Examination">
        <Field label="Anamnesis" value={text(shown.anamnesis)} />
        <Field label="Diagnosis" value={text(shown.diagnosis)} />
        <Field label="Therapy" value={text(shown.therapy)} />
      </DetailSection>

      <DetailSection title="Charges">
        {renderCharges?.(shown)}
        <div className={styles.total}>
          <span>Total</span>
          <span>{shown.cost !== undefined ? formatPrice(shown.cost) : 'No cost recorded'}</span>
        </div>
      </DetailSection>

      <DetailSection title="Images" count={shown.attachments.length}>
        {shown.attachments.length > 0 ? (
          <AttachmentStrip
            examinationId={shown.id}
            attachments={shown.attachments}
            editable={false}
          />
        ) : (
          <p className={styles.muted}>No images. Add them from Edit.</p>
        )}
      </DetailSection>
    </SlidePanel>
  )
}
