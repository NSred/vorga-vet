import { useCallback, useState } from 'react'
import { Combobox } from '@/shared/ui'
import { ownerLabel, searchOwners } from '../../api/ownersApi'
import { searchComboboxProps, useEntitySearch } from '@/shared/lib/useEntitySearch'
import type { OwnerOption } from '../../types'
import { CreateOwnerDialog } from './CreateOwnerDialog'
import styles from './OwnerPicker.module.css'

export interface OwnerPickerProps {
  value: OwnerOption | null
  onChange: (owner: OwnerOption) => void
  error?: string
}

export function OwnerPicker({ value, onChange, error }: OwnerPickerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const fetcher = useCallback((term: string) => searchOwners(term), [])
  const search = useEntitySearch(['owners'], fetcher)

  return (
    <div className={styles.wrapper}>
      <Combobox
        id="owner"
        label="Owner *"
        triggerText={value ? ownerLabel(value) : ''}
        placeholder="Search owners…"
        {...searchComboboxProps(search)}
        options={search.results.map((owner) => ({
          id: owner.id,
          label: ownerLabel(owner),
          hint: owner.phoneNumber,
        }))}
        onSelect={(option) => {
          const owner = search.results.find((candidate) => candidate.id === option.id)
          if (owner) onChange(owner)
        }}
        onCreate={() => setDialogOpen(true)}
        createLabel="Create owner"
        selectedIds={value ? [value.id] : []}
        emptyMessage="No owners found"
        error={error}
      />

      {value && <p className={styles.summary}>{value.phoneNumber}</p>}

      <CreateOwnerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={(owner) => {
          onChange(owner)
          setDialogOpen(false)
        }}
      />
    </div>
  )
}
