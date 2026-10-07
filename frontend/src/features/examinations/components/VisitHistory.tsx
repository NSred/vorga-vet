import type { ReactNode } from 'react'
import { DetailSection, EmptyState, layout, Skeleton } from '@/shared/ui'
import { usePatientExaminationsQuery } from '../hooks/usePatientExaminationsQuery'
import type { Examination } from '../types'
import { ExaminationCard } from './ExaminationCard'
import styles from './VisitHistory.module.css'

export interface VisitHistoryProps {
  patientId: string
  onEdit?: (examination: Examination) => void
  renderCharges?: (examination: Examination) => ReactNode
}

export function VisitHistory({ patientId, onEdit, renderCharges }: VisitHistoryProps) {
  const { data, isPending, isError } = usePatientExaminationsQuery(patientId)

  return (
    <DetailSection title="Visits" count={data?.length}>
      <VisitList
        data={data}
        isPending={isPending}
        isError={isError}
        onEdit={onEdit}
        renderCharges={renderCharges}
      />
    </DetailSection>
  )
}

interface VisitListProps extends Omit<VisitHistoryProps, 'patientId'> {
  data: Examination[] | undefined
  isPending: boolean
  isError: boolean
}

function VisitList({ data, isPending, isError, onEdit, renderCharges }: VisitListProps) {
  if (isPending) {
    return <Skeleton height="8rem" />
  }

  if (isError) {
    return <p className={styles.error}>Could not load the visit history.</p>
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        message="No visits recorded yet."
        icon="🩺"
        hint="Visits appear here after appointments."
      />
    )
  }

  return (
    <div className={layout.stackTight}>
      {data.map((examination) => (
        <ExaminationCard
          key={examination.id}
          examination={examination}
          onEdit={onEdit}
          charges={renderCharges?.(examination)}
        />
      ))}
    </div>
  )
}
