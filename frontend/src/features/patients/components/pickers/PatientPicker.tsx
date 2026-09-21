import { useCallback } from 'react'
import { Combobox } from '@/shared/ui'
import { getPatients } from '../../api/patientsApi'
import { useEntitySearch } from '../../hooks/useEntitySearch'
import type { PatientListItem } from '../../types'

export interface PatientPickerProps {
  value: PatientListItem | null
  onChange: (patient: PatientListItem | null) => void
  error?: string
}

export function patientLabel(patient: PatientListItem): string {
  return `${patient.name} · ${patient.ownerName}`
}

export function PatientPicker({ value, onChange, error }: PatientPickerProps) {
  const fetcher = useCallback(
    (term: string) =>
      getPatients({ search: term, status: 'active' }, 1, 10).then((page) => page.items),
    [],
  )
  const { query, setQuery, results, isLoading, errorMessage } = useEntitySearch(
    ['patients', 'picker'],
    fetcher,
  )

  return (
    <Combobox
      id="patient"
      label="Patient"
      triggerText={value ? patientLabel(value) : ''}
      placeholder="Search patients…"
      query={query}
      onQueryChange={setQuery}
      options={results.map((patient) => ({
        id: patient.id,
        label: patientLabel(patient),
        hint: patient.cardNumber,
      }))}
      onSelect={(option) => {
        const patient = results.find((candidate) => candidate.id === option.id)
        if (patient) onChange(patient)
      }}
      onClear={value ? () => onChange(null) : undefined}
      selectedIds={value ? [value.id] : []}
      isLoading={isLoading}
      errorMessage={errorMessage}
      emptyMessage="No patients found"
      error={error}
    />
  )
}
