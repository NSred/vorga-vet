import type { ReactNode } from 'react'
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton'
import styles from './Table.module.css'

export type TableColumnMobile = 'title' | 'detail' | 'hidden'

export interface TableColumn<T> {
  key: string
  header: string
  sortable?: boolean
  align?: 'left' | 'right'
  mobile?: TableColumnMobile
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
  rowClassName?: (row: T) => string | undefined
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
  rowClassName,
}: TableProps<T>) {
  const hasCards = columns.some((column) => column.mobile !== undefined)

  const cellProps = (column: TableColumn<T>) => ({
    style: column.align === 'right' ? { textAlign: 'right' as const } : undefined,
    ...(hasCards && {
      'data-label': column.header,
      'data-mobile': column.mobile ?? 'detail',
    }),
  })

  return (
    <div className={styles.scroller}>
      <table className={styles.table} data-cards={hasCards ? '' : undefined}>
        <thead>
          <tr>
            {columns.map((column) => {
              const isSorted = column.key === sortKey
              const arrow = isSorted ? (sortDirection === 'asc' ? '▲' : '▼') : ''
              return (
                <th
                  key={column.key}
                  className={column.sortable ? styles.sortable : undefined}
                  style={column.align === 'right' ? { textAlign: 'right' } : undefined}
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
                    <td key={column.key} {...cellProps(column)}>
                      <Skeleton height="1rem" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr
                  key={getRowId(row)}
                  className={
                    [onRowClick ? styles.clickableRow : undefined, rowClassName?.(row)]
                      .filter(Boolean)
                      .join(' ') || undefined
                  }
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((column) => (
                    <td key={column.key} {...cellProps(column)}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}
