import { useCallback } from 'react'
import { Combobox } from '@/shared/ui'
import { searchAllergens } from '../api/allergensApi'
import { searchComboboxProps, useEntitySearch } from '@/shared/lib/useEntitySearch'
import type { AllergenOption } from '../types'

export interface AllergenFilterProps {
  value: AllergenOption | null
  onChange: (allergen: AllergenOption | null) => void
}

export function AllergenFilter({ value, onChange }: AllergenFilterProps) {
  const fetcher = useCallback((term: string) => searchAllergens(term), [])
  const search = useEntitySearch(['allergens'], fetcher)

  return (
    <Combobox
      id="filter-allergen"
      label="Allergen"
      triggerText={value?.name ?? ''}
      placeholder="All"
      {...searchComboboxProps(search)}
      options={search.results.map((allergen) => ({ id: allergen.id, label: allergen.name }))}
      onSelect={(option) => onChange({ id: option.id, name: option.label })}
      onClear={value ? () => onChange(null) : undefined}
      selectedIds={value ? [value.id] : []}
      emptyMessage="No allergens found"
    />
  )
}
