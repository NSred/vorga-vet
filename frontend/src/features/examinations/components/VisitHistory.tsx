import { clinicDateOf, clinicTimeOf } from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { formatPrice } from '@/shared/lib/money'
import { DetailSection, EmptyState, Skeleton, Table, type TableColumn } from '@/shared/ui'
import { usePatientExaminationsQuery } from '../hooks/usePatientExaminationsQuery'
import { isUnpaid, performerOf, visitOrigin } from '../lib/visitLabels'
import { PaymentBadge } from './PaymentBadge'
import type { Examination } from '../types'
import styles from './VisitHistory.module.css'

export interface VisitHistoryProps {
  patientId: string
  onOpen?: (examination: Examination) => void
}

function ClampedText({ value }: { value?: string }) {
  if (!value) return <span className={styles.muted}>—</span>
  return <p className={styles.clamped}>{value}</p>
}

const COLUMNS: TableColumn<Examination>[] = [
  {
    key: 'date',
    header: 'Date',
    mobile: 'title',
    render: (visit) => (
      <span className={styles.dateStack}>
        <span className={styles.when}>
          {formatDisplayDate(clinicDateOf(visit.startedAt))} · {clinicTimeOf(visit.startedAt)}
        </span>
        <span className={styles.who}>{performerOf(visit)}</span>
        <span className={styles.who}>{visitOrigin(visit)}</span>
      </span>
    ),
  },
  {
    key: 'anamnesis',
    header: 'Anamnesis',
    render: (visit) => <ClampedText value={visit.anamnesis} />,
  },
  {
    key: 'diagnosis',
    header: 'Diagnosis',
    render: (visit) =>
      visit.diagnosis ? (
        <span className={styles.diagnosis}>{visit.diagnosis}</span>
      ) : (
        <span className={styles.muted}>—</span>
      ),
  },
  {
    key: 'therapy',
    header: 'Therapy',
    render: (visit) => <ClampedText value={visit.therapy} />,
  },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    render: (visit) => (
      <span className={styles.amountStack}>
        <span className={styles.cost}>
          {visit.cost !== undefined ? formatPrice(visit.cost) : '—'}
        </span>
        <PaymentBadge examination={visit} />
      </span>
    ),
  },
]

export function VisitHistory({ patientId, onOpen }: VisitHistoryProps) {
  const { data, isPending, isError } = usePatientExaminationsQuery(patientId)
  const outstanding = (data ?? [])
    .filter(isUnpaid)
    .reduce((sum, visit) => sum + (visit.cost ?? 0), 0)

  const body = isPending ? (
    <Skeleton height="8rem" />
  ) : isError ? (
    <p className={styles.error}>Could not load the visit history.</p>
  ) : !data || data.length === 0 ? (
    <EmptyState
      message="No visits recorded yet."
      icon="🩺"
      hint="Visits appear here after appointments."
    />
  ) : (
    <Table
      columns={COLUMNS}
      rows={data}
      getRowId={(visit) => visit.id}
      onRowClick={onOpen}
      rowClassName={() => styles.visitRow}
    />
  )

  return (
    <DetailSection
      title="Visits"
      count={data?.length}
      action={
        outstanding > 0 && (
          <span className={styles.outstanding}>
            Outstanding: <strong>{formatPrice(outstanding)}</strong>
          </span>
        )
      }
    >
      {body}
    </DetailSection>
  )
}
