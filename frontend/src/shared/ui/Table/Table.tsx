import type { ReactNode } from 'react'
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton'
import styles from './Table.module.css'

export interface TableColumn<T> {
  key: string
  header: string
  sortable?: boolean
  render: (row: T) => ReactNode
}

export interface TableProps<T> {
  columns: TableColumn<T>[]
  rows: T[]
  getRowId: (row: T) => string
  onRowClick?: (row: T) => void
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  onSortChange?: (key: string) => void
  isLoading?: boolean
  skeletonRowCount?: number
}

export function Table<T>({
  columns,
  rows,
  getRowId,
  onRowClick,
  sortKey,
  sortDirection,
  onSortChange,
  isLoading = false,
  skeletonRowCount = 5,
}: TableProps<T>) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          {columns.map((column) => {
            const isSorted = column.key === sortKey
            const arrow = isSorted ? (sortDirection === 'asc' ? '▲' : '▼') : ''
            return (
              <th
                key={column.key}
                className={column.sortable ? styles.sortable : undefined}
                onClick={column.sortable ? () => onSortChange?.(column.key) : undefined}
              >
                {column.header}
                {arrow}
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody>
        {isLoading
          ? Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
              <tr key={`skeleton-${rowIndex}`}>
                {columns.map((column) => (
                  <td key={column.key}>
                    <Skeleton height="1rem" />
                  </td>
                ))}
              </tr>
            ))
          : rows.map((row) => (
              <tr
                key={getRowId(row)}
                className={onRowClick ? styles.clickableRow : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key}>{column.render(row)}</td>
                ))}
              </tr>
            ))}
      </tbody>
    </table>
  )
}
