import { Badge, PagedTable, type TableColumn } from '@/shared/ui'
import { calculateAge } from '../lib/patientAge'
import type { PatientListItem } from '../types'
import { SPECIES_EMOJI } from '@/shared/domain/species'
import styles from './PatientTable.module.css'

export interface PatientTableProps {
  patients: PatientListItem[]
  isLoading: boolean
  page: number
  pageSize: number
  totalCount: number
  hasFilters: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onRowClick: (patient: PatientListItem) => void
  emptyMessage?: string
}

function formatValue(value: string | number | undefined): string {
  if (value === undefined || value === '' || (typeof value === 'number' && Number.isNaN(value))) {
    return '—'
  }
  return String(value)
}

const columns: TableColumn<PatientListItem>[] = [
  { key: 'cardNumber', header: 'No.', mobile: 'detail', render: (p) => p.cardNumber },
  {
    key: 'name',
    mobile: 'title',
    header: 'Name',
    render: (p) => (
      <span className={styles.nameCell}>
        {SPECIES_EMOJI[p.species]} <span className={styles.patientName}>{p.name}</span>
      </span>
    ),
  },
  { key: 'ownerName', header: 'Owner', mobile: 'detail', render: (p) => p.ownerName },
  { key: 'breedName', header: 'Breed', mobile: 'detail', render: (p) => p.breedName },
  {
    key: 'sex',
    mobile: 'detail',
    header: 'Sex',
    render: (p) => (
      <Badge tone={p.sex === 'female' ? 'female' : 'male'}>
        {p.sex === 'female' ? '♀ F' : '♂ M'}
      </Badge>
    ),
  },
  {
    key: 'age',
    header: 'Age',
    mobile: 'detail',
    render: (p) => formatValue(calculateAge(p.birthDate)),
  },
  {
    key: 'phoneNumber',
    header: 'Phone',
    mobile: 'detail',
    render: (p) => formatValue(p.phoneNumber),
  },
  {
    key: 'allergies',
    mobile: 'detail',
    header: 'Allergies',
    render: (p) =>
      p.allergies.length === 0 ? (
        <span className={styles.muted}>None</span>
      ) : (
        p.allergies.map((allergy) => (
          <Badge key={allergy} tone="warn">
            {allergy}
          </Badge>
        ))
      ),
  },
  { key: 'address', header: 'Address', mobile: 'hidden', render: (p) => formatValue(p.address) },
  {
    key: 'city',
    header: 'City',
    mobile: 'hidden',
    render: (p) => <Badge tone="neutral">{p.city}</Badge>,
  },
]

export function PatientTable({
  patients,
  isLoading,
  page,
  pageSize,
  totalCount,
  hasFilters,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  emptyMessage = 'No patients yet.',
}: PatientTableProps) {
  return (
    <PagedTable
      columns={columns}
      rows={patients}
      getRowId={(p) => p.id}
      isLoading={isLoading}
      page={page}
      pageSize={pageSize}
      totalCount={totalCount}
      emptyMessage={hasFilters ? 'No patients match your filters.' : emptyMessage}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onRowClick={onRowClick}
      rowClassName={(p) => (p.isDeleted ? styles.deletedRow : undefined)}
    />
  )
}
