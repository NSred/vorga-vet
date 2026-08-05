import { useMemo, useState } from 'react'
import { Badge, EmptyState, Pagination, Table, type TableColumn } from '@/shared/ui'
import type { Patient } from '../types'
import { SPECIES_EMOJI } from '../lib/speciesEmoji'
import styles from './PatientTable.module.css'

export interface PatientTableProps {
  patients: Patient[]
  isLoading: boolean
  onRowClick: (patient: Patient) => void
}

function formatValue(value: string | number | undefined): string {
  if (value === undefined || value === '' || (typeof value === 'number' && Number.isNaN(value))) {
    return '—'
  }
  return String(value)
}

export function PatientTable({ patients, isLoading, onRowClick }: PatientTableProps) {
  const [sortKey, setSortKey] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const sorted = useMemo(() => {
    const copy = [...patients]
    copy.sort((a, b) => {
      const left = String(a[sortKey as keyof Patient] ?? '')
      const right = String(b[sortKey as keyof Patient] ?? '')
      const comparison = left.localeCompare(right, 'en')
      return sortDirection === 'asc' ? comparison : -comparison
    })
    return copy
  }, [patients, sortKey, sortDirection])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSortChange = (key: string) => {
    if (key === sortKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const columns: TableColumn<Patient>[] = [
    { key: 'cardNumber', header: 'No.', sortable: true, render: (p) => p.cardNumber },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (p) => (
        <span className={styles.nameCell}>
          {SPECIES_EMOJI[p.species]} {p.name}
        </span>
      ),
    },
    { key: 'ownerName', header: 'Owner', sortable: true, render: (p) => p.ownerName },
    { key: 'breed', header: 'Breed', sortable: true, render: (p) => p.breed },
    {
      key: 'sex',
      header: 'Sex',
      sortable: true,
      render: (p) => <Badge tone={p.sex === 'female' ? 'female' : 'male'}>{p.sex === 'female' ? '♀ F' : '♂ M'}</Badge>,
    },
    { key: 'age', header: 'Age', sortable: true, render: (p) => formatValue(p.age) },
    { key: 'phone', header: 'Phone', render: (p) => formatValue(p.phone) },
    {
      key: 'allergies',
      header: 'Allergies',
      sortable: true,
      render: (p) =>
        p.allergies === 'none' ? (
          <span className={styles.muted}>None</span>
        ) : (
          <Badge tone="warn">{p.allergies}</Badge>
        ),
    },
    { key: 'address', header: 'Address', render: (p) => formatValue(p.address) },
    {
      key: 'city',
      header: 'City',
      sortable: true,
      render: (p) => <Badge tone="neutral">{p.city}</Badge>,
    },
  ]

  if (!isLoading && patients.length === 0) {
    return <EmptyState message="No patients match your search." />
  }

  return (
    <div>
      <Table
        columns={columns}
        rows={pageRows}
        getRowId={(p) => p.id}
        onRowClick={onRowClick}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        isLoading={isLoading}
      />
      <Pagination
        page={currentPage}
        pageCount={pageCount}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(1)
        }}
      />
    </div>
  )
}
