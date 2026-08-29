import { useCallback, useEffect, useRef, useState } from 'react'
import { Combobox } from '@/shared/ui'
import { searchBreeds } from '../../api/breedsApi'
import { useEntitySearch } from '../../hooks/useEntitySearch'
import type { BreedOption, Species } from '../../types'
import { CreateBreedDialog } from './CreateBreedDialog'

export interface BreedPickerProps {
  species: Species
  value: BreedOption | null
  onChange: (breed: BreedOption | null) => void
  error?: string
}

export function BreedPicker({ species, value, onChange, error }: BreedPickerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingName, setPendingName] = useState('')
  const previousSpecies = useRef(species)

  const fetcher = useCallback((term: string) => searchBreeds(species, term), [species])
  const { query, setQuery, results, isLoading, errorMessage } = useEntitySearch(
    ['breeds', species],
    fetcher,
  )

  useEffect(() => {
    if (previousSpecies.current !== species) {
      previousSpecies.current = species
      setQuery('')
      onChange(null)
    }
  }, [species, onChange, setQuery])

  return (
    <>
      <Combobox
        id="breed"
        label="Breed *"
        triggerText={value?.name ?? ''}
        placeholder="Search breeds…"
        query={query}
        onQueryChange={setQuery}
        options={results.map((breed) => ({ id: breed.id, label: breed.name }))}
        onSelect={(option) => onChange({ id: option.id, name: option.label })}
        onCreate={(typed) => {
          setPendingName(typed)
          setDialogOpen(true)
        }}
        createLabel="Create breed"
        selectedIds={value ? [value.id] : []}
        isLoading={isLoading}
        errorMessage={errorMessage}
        emptyMessage="No breeds found for this species"
        error={error}
      />

      <CreateBreedDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        species={species}
        initialName={pendingName}
        onCreated={(breed) => {
          onChange(breed)
          setDialogOpen(false)
        }}
      />
    </>
  )
}
