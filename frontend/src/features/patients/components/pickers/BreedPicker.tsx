import { useCallback, useEffect, useRef, useState } from 'react'
import { Combobox } from '@/shared/ui'
import { searchBreeds } from '../../api/breedsApi'
import { searchComboboxProps, useEntitySearch } from '@/shared/lib/useEntitySearch'
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
  const search = useEntitySearch(['breeds', species], fetcher)
  const { setQuery } = search

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
        {...searchComboboxProps(search)}
        options={search.results.map((breed) => ({ id: breed.id, label: breed.name }))}
        onSelect={(option) => onChange({ id: option.id, name: option.label })}
        onCreate={(typed) => {
          setPendingName(typed)
          setDialogOpen(true)
        }}
        createLabel="Create breed"
        selectedIds={value ? [value.id] : []}
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
