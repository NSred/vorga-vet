import { useMemo, useState } from 'react'
import { Badge, EmptyState, Pagination, Table, type TableColumn } from '@/shared/ui'
import type { Patient } from '../types'
import styles from './PatientTable.module.css'

export interface PatientTableProps {
  patients: Patient[]
  isLoading: boolean
  onRowClick: (patient: Patient) => void
}

const SPECIES_EMOJI: Record<Patient['species'], string> = {
  pas: '🐶',
  macka: '🐱',
  ptica: '🐦',
  ostalo: '🐾',
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
      const comparison = left.localeCompare(right, 'sr')
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
    { key: 'cardNumber', header: 'Rbr', sortable: true, render: (p) => p.cardNumber },
    {
      key: 'name',
      header: 'Ime',
      sortable: true,
      render: (p) => (
        <span className={styles.nameCell}>
          {SPECIES_EMOJI[p.species]} {p.name}
        </span>
      ),
    },
    { key: 'ownerName', header: 'Vlasnik', sortable: true, render: (p) => p.ownerName },
    { key: 'breed', header: 'Rasa', sortable: true, render: (p) => p.breed },
    {
      key: 'sex',
      header: 'Pol',
      sortable: true,
      render: (p) => <Badge tone={p.sex === 'zenka' ? 'female' : 'male'}>{p.sex === 'zenka' ? '♀ Ž' : '♂ M'}</Badge>,
    },
    { key: 'age', header: 'God', sortable: true, render: (p) => formatValue(p.age) },
    { key: 'phone', header: 'Telefon', render: (p) => formatValue(p.phone) },
    {
      key: 'allergies',
      header: 'Alergije',
      sortable: true,
      render: (p) =>
        p.allergies === 'nema' ? (
          <span className={styles.muted}>Nema</span>
        ) : (
          <Badge tone="warn">{p.allergies}</Badge>
        ),
    },
    { key: 'address', header: 'Adresa', render: (p) => formatValue(p.address) },
    {
      key: 'city',
      header: 'Grad',
      sortable: true,
      render: (p) => <Badge tone="neutral">{p.city}</Badge>,
    },
  ]

  if (!isLoading && patients.length === 0) {
    return <EmptyState message="Nema pacijenata koji odgovaraju pretrazi." />
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
