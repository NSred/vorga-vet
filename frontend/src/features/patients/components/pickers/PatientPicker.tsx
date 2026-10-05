import { useCallback } from 'react'
import { searchComboboxProps, usePagedEntitySearch } from '@/shared/lib/useEntitySearch'
import { Combobox } from '@/shared/ui'
import { getPatients } from '../../api/patientsApi'
import type { PatientListItem } from '../../types'

export interface PatientPickerProps {
  value: PatientListItem | null
  onChange: (patient: PatientListItem | null) => void
  error?: string
}

const PAGE_SIZE = 15

export function patientLabel(patient: PatientListItem): string {
  return `${patient.name} · ${patient.ownerName}`
}

export function PatientPicker({ value, onChange, error }: PatientPickerProps) {
  const fetchPage = useCallback(
    (term: string, page: number) =>
      getPatients({ search: term, status: 'active' }, page, PAGE_SIZE),
    [],
  )
  const search = usePagedEntitySearch(['patients', 'picker'], fetchPage)

  return (
    <Combobox
      id="patient"
      label="Patient"
      triggerText={value ? patientLabel(value) : ''}
      placeholder="Search patients…"
      {...searchComboboxProps(search)}
      options={search.results.map((patient) => ({
        id: patient.id,
        label: patientLabel(patient),
        hint: patient.cardNumber,
      }))}
      onSelect={(option) => {
        const patient = search.results.find((candidate) => candidate.id === option.id)
        if (patient) onChange(patient)
      }}
      onClear={value ? () => onChange(null) : undefined}
      selectedIds={value ? [value.id] : []}
      emptyMessage="No patients found"
      error={error}
    />
  )
}
