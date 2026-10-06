import { Badge, PagedTable, type TableColumn } from '@/shared/ui'
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
  const what = kind === 'service' ? 'services' : 'medications'

  return (
    <PagedTable
      columns={COLUMNS[kind]}
      rows={items}
      getRowId={(item) => item.id}
      isLoading={isLoading}
      page={page}
      pageSize={pageSize}
      totalCount={totalCount}
      pageSizeOptions={PRICE_LIST_PAGE_SIZES}
      emptyMessage={hasSearch ? `No ${what} match your search.` : `No ${what} here yet.`}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onRowClick={onRowClick}
      rowClassName={(item) => (item.isActive ? undefined : styles.retiredRow)}
    />
  )
}
