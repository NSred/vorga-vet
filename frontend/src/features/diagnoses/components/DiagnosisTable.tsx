import { Badge, PagedTable, type TableColumn } from '@/shared/ui'
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
  return (
    <PagedTable
      columns={COLUMNS}
      rows={diagnoses}
      getRowId={(diagnosis) => diagnosis.id}
      isLoading={isLoading}
      page={page}
      pageSize={pageSize}
      totalCount={totalCount}
      pageSizeOptions={DIAGNOSIS_PAGE_SIZES}
      emptyMessage={hasSearch ? 'No diagnoses match your search.' : 'No diagnoses here yet.'}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onRowClick={onRowClick}
      rowClassName={(diagnosis) => (diagnosis.isActive ? undefined : styles.retiredRow)}
    />
  )
}
