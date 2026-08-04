import { Button, Select, SearchInput } from '@/shared/ui'
import type { PatientFilters as PatientFiltersType } from '../types'
import styles from './PatientFilters.module.css'

export interface PatientFiltersProps {
  filters: PatientFiltersType
  onChange: (filters: PatientFiltersType) => void
}

const DEFAULT_FILTERS: PatientFiltersType = { status: 'aktivan' }

export function PatientFilters({ filters, onChange }: PatientFiltersProps) {
  const status = filters.status ?? 'aktivan'

  return (
    <div className={styles.bar}>
      <SearchInput
        value={filters.search ?? ''}
        onChange={(search) => onChange({ ...filters, search })}
        placeholder="Pretraga: vlasnik, ime, rasa, telefon, čip br., adresa, anamneza…"
      />

      <Select
        id="filter-species"
        label="Vrsta"
        value={filters.species ?? 'sve'}
        onChange={(species) => onChange({ ...filters, species: species as PatientFiltersType['species'] })}
        options={[
          { value: 'sve', label: 'Vrsta: sve' },
          { value: 'pas', label: 'Pas' },
          { value: 'macka', label: 'Mačka' },
          { value: 'ptica', label: 'Ptica' },
          { value: 'ostalo', label: 'Ostalo' },
        ]}
      />

      <Select
        id="filter-sex"
        label="Pol"
        value={filters.sex ?? 'svi'}
        onChange={(sex) => onChange({ ...filters, sex: sex as PatientFiltersType['sex'] })}
        options={[
          { value: 'svi', label: 'Pol: svi' },
          { value: 'muzjak', label: 'Mužjak' },
          { value: 'zenka', label: 'Ženka' },
        ]}
      />

      <Select
        id="filter-allergies"
        label="Alergije"
        value={filters.allergies ?? 'sve'}
        onChange={(allergies) =>
          onChange({ ...filters, allergies: allergies as PatientFiltersType['allergies'] })
        }
        options={[
          { value: 'sve', label: 'Alergije: sve' },
          { value: 'nema', label: 'Nema' },
          { value: 'hrana', label: 'Hrana' },
          { value: 'lekovi', label: 'Lekovi' },
          { value: 'buve_krpelji', label: 'Buve/krpelji' },
          { value: 'polen', label: 'Polen' },
          { value: 'ostalo', label: 'Ostalo' },
        ]}
      />

      <Select
        id="filter-city"
        label="Grad"
        value={filters.city ?? 'svi'}
        onChange={(city) => onChange({ ...filters, city: city === 'svi' ? undefined : city })}
        options={[
          { value: 'svi', label: 'Grad: svi' },
          { value: 'Beograd', label: 'Beograd' },
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
        Dužnici
      </label>

      <div className={styles.segmented}>
        {(['aktivan', 'svi', 'obrisan'] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={`${styles.segment} ${status === value ? styles.segmentActive : ''}`}
            onClick={() => onChange({ ...filters, status: value })}
          >
            {value === 'aktivan' ? 'Aktivni' : value === 'svi' ? 'Svi' : 'Brisani'}
          </button>
        ))}
      </div>

      <Button variant="outline" type="button" onClick={() => onChange(DEFAULT_FILTERS)}>
        Poništi
      </Button>
    </div>
  )
}
