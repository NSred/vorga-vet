import { useEffect, useState } from 'react'
import { Button, Select, SearchInput, SegmentedControl } from '@/shared/ui'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import type { PatientFilters as PatientFiltersType } from '../types'
import { AllergenFilter } from './AllergenFilter'
import styles from './PatientFilters.module.css'

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
  const committedSearch = filters.search ?? ''
  const [searchDraft, setSearchDraft] = useState(committedSearch)
  const debouncedSearch = useDebouncedValue(searchDraft, 300)

  useEffect(() => {
    if (debouncedSearch === committedSearch) return
    onChange({ ...filters, search: debouncedSearch || undefined })
  }, [debouncedSearch, committedSearch, filters, onChange])

  return (
    <div className={styles.bar}>
      <div className={styles.leftGroup}>
        <SearchInput value={searchDraft} onChange={setSearchDraft} placeholder="Search" />

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
          options={[
            { value: 'all', label: 'All' },
            { value: 'dog', label: 'Dog' },
            { value: 'cat', label: 'Cat' },
            { value: 'bird', label: 'Bird' },
            { value: 'other', label: 'Other' },
          ]}
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

      <div className={styles.rightGroup}>
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
