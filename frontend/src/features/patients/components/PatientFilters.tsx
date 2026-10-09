import { SPECIES_OPTIONS } from '@/shared/domain/species'
import { Button, layout, SearchInput, SegmentedControl, Select } from '@/shared/ui'
import { useSearchDraft } from '@/shared/lib/useSearchDraft'
import type { PatientFilters as PatientFiltersType } from '../types'
import { AllergenFilter } from './AllergenFilter'

export interface PatientFiltersProps {
  filters: PatientFiltersType
  onChange: (filters: PatientFiltersType) => void
}

const DEFAULT_FILTERS: PatientFiltersType = { status: 'active' }

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'all', label: 'All' },
  { value: 'deleted', label: 'Deleted' },
] as const

export function PatientFilters({ filters, onChange }: PatientFiltersProps) {
  const status = filters.status ?? 'active'
  const [searchDraft, setSearchDraft] = useSearchDraft(filters.search ?? '', (search) =>
    onChange({ ...filters, search: search || undefined }),
  )

  return (
    <div className={layout.toolbar}>
      <div className={layout.toolbarGroup}>
        <SearchInput
          value={searchDraft}
          onChange={setSearchDraft}
          placeholder="Card no., name, owner, phone"
        />

        <Select
          id="filter-species"
          label="Species"
          value={filters.species ?? 'all'}
          onChange={(species) =>
            onChange({
              ...filters,
              species: species === 'all' ? undefined : (species as PatientFiltersType['species']),
            })
          }
          options={[{ value: 'all', label: 'All' }, ...SPECIES_OPTIONS]}
        />

        <Select
          id="filter-sex"
          label="Sex"
          value={filters.sex ?? 'all'}
          onChange={(sex) =>
            onChange({
              ...filters,
              sex: sex === 'all' ? undefined : (sex as PatientFiltersType['sex']),
            })
          }
          options={[
            { value: 'all', label: 'All' },
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
          ]}
        />

        <AllergenFilter
          value={filters.allergen ?? null}
          onChange={(allergen) => onChange({ ...filters, allergen })}
        />

        <Select
          id="filter-city"
          label="City"
          value={filters.city ?? 'all'}
          onChange={(city) => onChange({ ...filters, city: city === 'all' ? undefined : city })}
          options={[
            { value: 'all', label: 'All' },
            { value: 'Belgrade', label: 'Belgrade' },
            { value: 'Novi Sad', label: 'Novi Sad' },
            { value: 'Petrovaradin', label: 'Petrovaradin' },
          ]}
        />
      </div>

      <div className={layout.toolbarGroup}>
        <SegmentedControl
          value={status}
          onChange={(value) => onChange({ ...filters, status: value })}
          options={STATUS_OPTIONS}
        />

        <Button
          variant="outline"
          type="button"
          onClick={() => {
            setSearchDraft('')
            onChange(DEFAULT_FILTERS)
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  )
}
