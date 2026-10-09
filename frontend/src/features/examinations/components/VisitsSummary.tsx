import { clinicDateOf } from '@/shared/lib/clinicTime'
import { formatDisplayDate } from '@/shared/lib/dateOnly'
import { Badge, Button, DetailSection, EmptyState, Skeleton } from '@/shared/ui'
import { usePatientExaminationsQuery } from '../hooks/usePatientExaminationsQuery'
import { isUnpaid } from '../lib/visitLabels'
import type { Examination } from '../types'
import styles from './VisitsSummary.module.css'

export interface VisitsSummaryProps {
  patientId: string
  onOpen: () => void
}

function LatestVisit({ visits }: { visits: Examination[] }) {
  const latest = visits[0]
  const unpaid = visits.filter(isUnpaid).length

  return (
    <div className={styles.latest}>
      <span className={styles.label}>Latest visit</span>
      <span className={styles.line}>
        <span className={styles.date}>{formatDisplayDate(clinicDateOf(latest.startedAt))}</span>
        {latest.diagnosis && <span>{latest.diagnosis}</span>}
        {unpaid > 0 && <Badge tone="warn">{unpaid} unpaid</Badge>}
      </span>
    </div>
  )
}

export function VisitsSummary({ patientId, onOpen }: VisitsSummaryProps) {
  const { data, isPending, isError } = usePatientExaminationsQuery(patientId)
  const visits = data ?? []

  const body = isPending ? (
    <Skeleton height="3rem" />
  ) : isError ? (
    <p className={styles.error}>Could not load the visit history.</p>
  ) : visits.length === 0 ? (
    <EmptyState
      message="No visits recorded yet."
      icon="🩺"
      hint="Visits appear here after appointments."
    />
  ) : (
    <LatestVisit visits={visits} />
  )

  return (
    <DetailSection
      title="Visits"
      count={data?.length}
      action={
        visits.length > 0 && (
          <Button variant="soft" type="button" onClick={onOpen}>
            Open visit history ›
          </Button>
        )
      }
    >
      {body}
    </DetailSection>
  )
}
