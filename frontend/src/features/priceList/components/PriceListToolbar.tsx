import { CATALOG_STATUS_OPTIONS, layout, SearchInput, SegmentedControl } from '@/shared/ui'
import { useSearchDraft } from '@/shared/lib/useSearchDraft'
import type { PriceListFilters, PriceListKind } from '../types'

export interface PriceListToolbarProps {
  kind: PriceListKind
  filters: PriceListFilters
  onKindChange: (kind: PriceListKind) => void
  onFiltersChange: (filters: PriceListFilters) => void
}

const KIND_OPTIONS = [
  { value: 'service', label: 'Services' },
  { value: 'medication', label: 'Medications' },
] as const

export function PriceListToolbar({
  kind,
  filters,
  onKindChange,
  onFiltersChange,
}: PriceListToolbarProps) {
  const [searchDraft, setSearchDraft] = useSearchDraft(filters.search ?? '', (search) =>
    onFiltersChange({ ...filters, search: search || undefined }),
  )

  const changeKind = (next: PriceListKind) => {
    setSearchDraft('')
    onKindChange(next)
  }

  return (
    <div className={layout.toolbar}>
      <div className={layout.toolbarGroup}>
        <SegmentedControl value={kind} onChange={changeKind} options={KIND_OPTIONS} />
        <SearchInput
          value={searchDraft}
          onChange={setSearchDraft}
          placeholder={kind === 'service' ? 'Search services' : 'Search medications'}
        />
      </div>
      <SegmentedControl
        value={filters.status}
        onChange={(status) => onFiltersChange({ ...filters, status })}
        options={CATALOG_STATUS_OPTIONS}
      />
    </div>
  )
}
