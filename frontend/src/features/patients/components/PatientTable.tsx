import { Badge, EmptyState, Pagination, Table, type TableColumn } from '@/shared/ui'
import { calculateAge } from '../lib/patientAge'
import type { PatientListItem } from '../types'
import { SPECIES_EMOJI } from '../lib/speciesEmoji'
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
}

function formatValue(value: string | number | undefined): string {
  if (value === undefined || value === '' || (typeof value === 'number' && Number.isNaN(value))) {
    return '—'
  }
  return String(value)
}

const columns: TableColumn<PatientListItem>[] = [
  { key: 'cardNumber', header: 'No.', render: (p) => p.cardNumber },
  {
    key: 'name',
    header: 'Name',
    render: (p) => (
      <span className={styles.nameCell}>
        {SPECIES_EMOJI[p.species]} <span className={styles.patientName}>{p.name}</span>
      </span>
    ),
  },
  { key: 'ownerName', header: 'Owner', render: (p) => p.ownerName },
  { key: 'breedName', header: 'Breed', render: (p) => p.breedName },
  {
    key: 'sex',
    header: 'Sex',
    render: (p) => (
      <Badge tone={p.sex === 'female' ? 'female' : 'male'}>
        {p.sex === 'female' ? '♀ F' : '♂ M'}
      </Badge>
    ),
  },
  { key: 'age', header: 'Age', render: (p) => formatValue(calculateAge(p.birthDate)) },
  { key: 'phoneNumber', header: 'Phone', render: (p) => formatValue(p.phoneNumber) },
  {
    key: 'allergies',
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
  { key: 'address', header: 'Address', render: (p) => formatValue(p.address) },
  { key: 'city', header: 'City', render: (p) => <Badge tone="neutral">{p.city}</Badge> },
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
}: PatientTableProps) {
  if (!isLoading && patients.length === 0) {
    return (
      <EmptyState message={hasFilters ? 'No patients match your filters.' : 'No patients yet.'} />
    )
  }

  return (
    <div>
      <Table
        columns={columns}
        rows={patients}
        getRowId={(p) => p.id}
        onRowClick={onRowClick}
        rowClassName={(p) => (p.isDeleted ? styles.deletedRow : undefined)}
        isLoading={isLoading}
      />
      <Pagination
        page={page}
        pageCount={Math.max(1, Math.ceil(totalCount / pageSize))}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}
