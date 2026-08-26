import { useCallback, useState } from 'react'
import { Combobox } from '@/shared/ui'
import { searchAllergens } from '../../api/allergensApi'
import { useEntitySearch } from '../../hooks/useEntitySearch'
import type { AllergenOption } from '../../types'
import { CreateAllergenDialog } from './CreateAllergenDialog'
import styles from './AllergenPicker.module.css'

export interface AllergenPickerProps {
  value: AllergenOption[]
  onChange: (allergens: AllergenOption[]) => void
}

export function AllergenPicker({ value, onChange }: AllergenPickerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingName, setPendingName] = useState('')
  const fetcher = useCallback((term: string) => searchAllergens(term), [])
  const { query, setQuery, results, isLoading, errorMessage } = useEntitySearch(fetcher)

  function add(allergen: AllergenOption) {
    if (value.some((selected) => selected.id === allergen.id)) return
    onChange([...value, allergen])
  }

  return (
    <div className={styles.wrapper}>
      <Combobox
        id="allergens"
        label="Allergens"
        triggerText={value.length > 0 ? `${value.length} selected` : ''}
        placeholder="Search allergens…"
        query={query}
        onQueryChange={setQuery}
        options={results.map((allergen) => ({ id: allergen.id, label: allergen.name }))}
        onSelect={(option) => add({ id: option.id, name: option.label })}
        onCreate={(typed) => {
          setPendingName(typed)
          setDialogOpen(true)
        }}
        createLabel="Create allergen"
        selectedIds={value.map((allergen) => allergen.id)}
        isLoading={isLoading}
        errorMessage={errorMessage}
        emptyMessage="No allergens found"
      />

      {value.length > 0 && (
        <ul className={styles.chips}>
          {value.map((allergen) => (
            <li key={allergen.id} className={styles.chip}>
              {allergen.name}
              <button
                type="button"
                className={styles.remove}
                aria-label={`Remove ${allergen.name}`}
                onClick={() => onChange(value.filter((item) => item.id !== allergen.id))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <CreateAllergenDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialName={pendingName}
        onCreated={(allergen) => {
          add(allergen)
          setDialogOpen(false)
        }}
      />
    </div>
  )
}
