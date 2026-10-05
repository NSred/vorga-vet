import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { isApiErrorCode } from '@/shared/lib/apiClient'
import { searchComboboxProps } from '@/shared/lib/useEntitySearch'
import { Combobox } from '@/shared/ui'
import { getDiagnoses } from '../api/diagnosesApi'
import { diagnosisErrors } from '../api/diagnosisErrors'
import { diagnosisKeys } from '../api/diagnosisKeys'
import { useCreateDiagnosis } from '../hooks/useDiagnosisMutations'
import { useDiagnosisSearch } from '../hooks/useDiagnosisSearch'
import { CreateDiagnosisDialog } from './CreateDiagnosisDialog'
import styles from './DiagnosisPicker.module.css'

export interface DiagnosisPickerProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

function sameName(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase()
}

function useIsListed(name: string): boolean {
  const { data } = useQuery({
    queryKey: diagnosisKeys.exact(name),
    queryFn: () => getDiagnoses({ search: name, status: 'all' }, 1, 100),
    enabled: name.length > 0 && name.length <= 200,
  })
  return data?.items.some((item) => sameName(item.name, name)) ?? true
}

export function DiagnosisPicker({ value, onChange, error }: DiagnosisPickerProps) {
  const search = useDiagnosisSearch()
  const create = useCreateDiagnosis()
  const [note, setNote] = useState<string | undefined>(undefined)
  const [draftName, setDraftName] = useState<string | null>(null)
  const typed = value.trim()
  const isListed = useIsListed(typed)

  const choose = (text: string) => {
    setNote(undefined)
    search.setQuery('')
    onChange(text)
  }

  const addToList = () => {
    create.mutate(
      { name: typed },
      {
        onSuccess: () => setNote(`${typed} was added to the diagnosis list`),
        onError: (failure) =>
          setNote(
            isApiErrorCode(failure, diagnosisErrors.nameNotUnique)
              ? 'Already on the list, possibly retired'
              : 'Could not add it to the list',
          ),
      },
    )
  }

  return (
    <div className={styles.field}>
      <Combobox
        id="diagnosis"
        label="Diagnosis"
        triggerText={value}
        placeholder="Search or type a diagnosis…"
        {...searchComboboxProps(search)}
        options={search.results.map((diagnosis) => ({
          id: diagnosis.id,
          label: diagnosis.name,
          hint: diagnosis.code,
        }))}
        onSelect={(option) => choose(option.label)}
        onCreate={(text) => setDraftName(text)}
        onClear={value ? () => choose('') : undefined}
        createLabel="Create diagnosis"
        selectedIds={search.results
          .filter((item) => sameName(item.name, value))
          .map((item) => item.id)}
        emptyMessage="No diagnoses match"
        error={error}
      />
      {typed && !isListed && typed.length <= 200 && (
        <button
          type="button"
          className={styles.addButton}
          onClick={addToList}
          disabled={create.isPending}
        >
          ＋ Add to diagnosis list
        </button>
      )}
      <CreateDiagnosisDialog
        open={draftName !== null}
        onOpenChange={(open) => !open && setDraftName(null)}
        initialName={draftName ?? ''}
        onCreated={(name) => {
          setDraftName(null)
          choose(name)
        }}
        onUseWithoutAdding={(name) => {
          setDraftName(null)
          choose(name)
        }}
      />
      {note && (
        <p className={styles.note} role="status">
          {note}
        </p>
      )}
    </div>
  )
}
