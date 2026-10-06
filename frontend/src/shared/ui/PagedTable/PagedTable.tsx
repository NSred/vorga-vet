import { EmptyState } from '../EmptyState/EmptyState'
import { Pagination } from '../Pagination/Pagination'
import { Table, type TableColumn } from '../Table/Table'

export interface PagedTableProps<T> {
  columns: TableColumn<T>[]
  rows: T[]
  getRowId: (row: T) => string
  isLoading: boolean
  page: number
  pageSize: number
  totalCount: number
  pageSizeOptions?: number[]
  emptyMessage: string
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onRowClick?: (row: T) => void
  rowClassName?: (row: T) => string | undefined
}

export function PagedTable<T>({
  columns,
  rows,
  getRowId,
  isLoading,
  page,
  pageSize,
  totalCount,
  pageSizeOptions,
  emptyMessage,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  rowClassName,
}: PagedTableProps<T>) {
  if (!isLoading && rows.length === 0) {
    return <EmptyState message={emptyMessage} />
  }

  return (
    <div>
      <Table
        columns={columns}
        rows={rows}
        getRowId={getRowId}
        onRowClick={onRowClick}
        rowClassName={rowClassName}
        isLoading={isLoading}
      />
      <Pagination
        page={page}
        pageCount={Math.max(1, Math.ceil(totalCount / pageSize))}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}
