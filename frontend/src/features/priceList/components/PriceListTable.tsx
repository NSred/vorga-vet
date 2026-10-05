import { Badge, EmptyState, Pagination, Table, type TableColumn } from '@/shared/ui'
import { formatPrice } from '@/shared/lib/money'
import { PRICE_LIST_PAGE_SIZES } from '../lib/priceListParams'
import type { PriceListItem, PriceListKind } from '../types'
import styles from './PriceListTable.module.css'

export interface PriceListTableProps {
  kind: PriceListKind
  items: PriceListItem[]
  isLoading: boolean
  page: number
  pageSize: number
  totalCount: number
  hasSearch: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onRowClick: (item: PriceListItem) => void
}

const nameColumn: TableColumn<PriceListItem> = {
  key: 'name',
  header: 'Name',
  render: (item) => (
    <span className={styles.nameCell}>
      <span className={styles.name}>{item.name}</span>
      {item.vaccine && (
        <Badge tone="ok">{item.vaccine.isRabies ? 'Rabies vaccine' : 'Vaccine'}</Badge>
      )}
      {!item.isActive && <Badge tone="neutral">Retired</Badge>}
    </span>
  ),
}

const unitColumn: TableColumn<PriceListItem> = {
  key: 'unit',
  header: 'Unit',
  render: (item) => item.unit ?? <span className={styles.muted}>—</span>,
}

const priceColumn: TableColumn<PriceListItem> = {
  key: 'price',
  header: 'Price',
  render: (item) => <span className={styles.price}>{formatPrice(item.price)}</span>,
}

const COLUMNS: Record<PriceListKind, TableColumn<PriceListItem>[]> = {
  service: [nameColumn, priceColumn],
  medication: [nameColumn, unitColumn, priceColumn],
}

export function PriceListTable({
  kind,
  items,
  isLoading,
  page,
  pageSize,
  totalCount,
  hasSearch,
  onPageChange,
  onPageSizeChange,
  onRowClick,
}: PriceListTableProps) {
  if (!isLoading && items.length === 0) {
    const what = kind === 'service' ? 'services' : 'medications'
    return (
      <EmptyState message={hasSearch ? `No ${what} match your search.` : `No ${what} here yet.`} />
    )
  }

  return (
    <div>
      <Table
        columns={COLUMNS[kind]}
        rows={items}
        getRowId={(item) => item.id}
        onRowClick={onRowClick}
        rowClassName={(item) => (item.isActive ? undefined : styles.retiredRow)}
        isLoading={isLoading}
      />
      <Pagination
        page={page}
        pageCount={Math.max(1, Math.ceil(totalCount / pageSize))}
        pageSize={pageSize}
        pageSizeOptions={PRICE_LIST_PAGE_SIZES}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}
