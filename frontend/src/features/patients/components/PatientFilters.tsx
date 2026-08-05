import { Button, Select, SearchInput } from '@/shared/ui'
import type { PatientFilters as PatientFiltersType } from '../types'
import styles from './PatientFilters.module.css'

export interface PatientFiltersProps {
  filters: PatientFiltersType
  onChange: (filters: PatientFiltersType) => void
}

const DEFAULT_FILTERS: PatientFiltersType = { status: 'active' }

export function PatientFilters({ filters, onChange }: PatientFiltersProps) {
  const status = filters.status ?? 'active'

  return (
    <div className={styles.bar}>
      <SearchInput
        value={filters.search ?? ''}
        onChange={(search) => onChange({ ...filters, search })}
        placeholder="Search: owner, name, breed, phone, chip no., address, history…"
      />

      <Select
        id="filter-species"
        label="Species"
        value={filters.species ?? 'all'}
        onChange={(species) => onChange({ ...filters, species: species as PatientFiltersType['species'] })}
        options={[
          { value: 'all', label: 'Species: all' },
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
        onChange={(sex) => onChange({ ...filters, sex: sex as PatientFiltersType['sex'] })}
        options={[
          { value: 'all', label: 'Sex: all' },
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ]}
      />

      <Select
        id="filter-allergies"
        label="Allergies"
        value={filters.allergies ?? 'all'}
        onChange={(allergies) =>
          onChange({ ...filters, allergies: allergies as PatientFiltersType['allergies'] })
        }
        options={[
          { value: 'all', label: 'Allergies: all' },
          { value: 'none', label: 'None' },
          { value: 'food', label: 'Food' },
          { value: 'medication', label: 'Medication' },
          { value: 'fleas_ticks', label: 'Fleas/ticks' },
          { value: 'pollen', label: 'Pollen' },
          { value: 'other', label: 'Other' },
        ]}
      />

      <Select
        id="filter-city"
        label="City"
        value={filters.city ?? 'all'}
        onChange={(city) => onChange({ ...filters, city: city === 'all' ? undefined : city })}
        options={[
          { value: 'all', label: 'City: all' },
          { value: 'Belgrade', label: 'Belgrade' },
          { value: 'Novi Sad', label: 'Novi Sad' },
          { value: 'Petrovaradin', label: 'Petrovaradin' },
        ]}
      />

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={filters.debtorsOnly ?? false}
          onChange={(event) => onChange({ ...filters, debtorsOnly: event.target.checked })}
        />
        Debtors
      </label>

      <div className={styles.segmented}>
        {(['active', 'all', 'deleted'] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={`${styles.segment} ${status === value ? styles.segmentActive : ''}`}
            onClick={() => onChange({ ...filters, status: value })}
          >
            {value === 'active' ? 'Active' : value === 'all' ? 'All' : 'Deleted'}
          </button>
        ))}
      </div>

      <Button variant="outline" type="button" onClick={() => onChange(DEFAULT_FILTERS)}>
        Reset
      </Button>
    </div>
  )
}
