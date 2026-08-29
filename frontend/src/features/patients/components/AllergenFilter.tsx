import { useCallback } from 'react'
import { Combobox } from '@/shared/ui'
import { searchAllergens } from '../api/allergensApi'
import { useEntitySearch } from '../hooks/useEntitySearch'
import type { AllergenOption } from '../types'

export interface AllergenFilterProps {
  value: AllergenOption | null
  onChange: (allergen: AllergenOption | null) => void
}

export function AllergenFilter({ value, onChange }: AllergenFilterProps) {
  const fetcher = useCallback((term: string) => searchAllergens(term), [])
  const { query, setQuery, results, isLoading, errorMessage } = useEntitySearch(
    ['allergens'],
    fetcher,
  )

  return (
    <Combobox
      id="filter-allergen"
      label="Allergen"
      triggerText={value?.name ?? ''}
      placeholder="All"
      query={query}
      onQueryChange={setQuery}
      options={results.map((allergen) => ({ id: allergen.id, label: allergen.name }))}
      onSelect={(option) => onChange({ id: option.id, name: option.label })}
      onClear={value ? () => onChange(null) : undefined}
      selectedIds={value ? [value.id] : []}
      isLoading={isLoading}
      errorMessage={errorMessage}
      emptyMessage="No allergens found"
    />
  )
}
