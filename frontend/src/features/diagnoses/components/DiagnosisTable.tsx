import { Badge, EmptyState, Pagination, Table, type TableColumn } from '@/shared/ui'
import { DIAGNOSIS_PAGE_SIZES } from '../lib/diagnosisParams'
import type { Diagnosis } from '../types'
import styles from './DiagnosisTable.module.css'

export interface DiagnosisTableProps {
  diagnoses: Diagnosis[]
  isLoading: boolean
  page: number
  pageSize: number
  totalCount: number
  hasSearch: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onRowClick: (diagnosis: Diagnosis) => void
}

const COLUMNS: TableColumn<Diagnosis>[] = [
  {
    key: 'code',
    header: 'Code',
    render: (diagnosis) => diagnosis.code ?? <span className={styles.muted}>—</span>,
  },
  {
    key: 'name',
    header: 'Name',
    render: (diagnosis) => (
      <span className={styles.nameCell}>
        <span className={styles.name}>{diagnosis.name}</span>
        {!diagnosis.isActive && <Badge tone="neutral">Retired</Badge>}
      </span>
    ),
  },
]

export function DiagnosisTable({
  diagnoses,
  isLoading,
  page,
  pageSize,
  totalCount,
  hasSearch,
  onPageChange,
  onPageSizeChange,
  onRowClick,
}: DiagnosisTableProps) {
  if (!isLoading && diagnoses.length === 0) {
    return (
      <EmptyState
        message={hasSearch ? 'No diagnoses match your search.' : 'No diagnoses here yet.'}
      />
    )
  }

  return (
    <div>
      <Table
        columns={COLUMNS}
        rows={diagnoses}
        getRowId={(diagnosis) => diagnosis.id}
        onRowClick={onRowClick}
        rowClassName={(diagnosis) => (diagnosis.isActive ? undefined : styles.retiredRow)}
        isLoading={isLoading}
      />
      <Pagination
        page={page}
        pageCount={Math.max(1, Math.ceil(totalCount / pageSize))}
        pageSize={pageSize}
        pageSizeOptions={DIAGNOSIS_PAGE_SIZES}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}
