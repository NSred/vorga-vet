import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { SPECIES_OPTIONS } from '@/shared/domain/species'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { Button, layout, SearchInput, SegmentedControl, useToast } from '@/shared/ui'
import { searchBreeds } from '../../api/breedsApi'
import type { Species } from '../../types'
import { CreateBreedDialog } from '../pickers/CreateBreedDialog'
import { NamedList } from './NamedList'

const BACKEND_LIMIT = 20

export function BreedsTab() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [species, setSpecies] = useState<Species>('dog')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const term = useDebouncedValue(search, 300).trim()

  const breeds = useQuery({
    queryKey: ['breeds', species, 'list', term],
    queryFn: () => searchBreeds(species, term),
    meta: { errorTitle: 'Could not load the breeds' },
  })

  return (
    <div className={layout.stack}>
      <div className={layout.toolbar}>
        <div className={layout.toolbarGroup}>
          <SegmentedControl value={species} onChange={setSpecies} options={SPECIES_OPTIONS} />
          <SearchInput value={search} onChange={setSearch} placeholder="Search breeds" />
        </div>
        <Button variant="primary" type="button" onClick={() => setDialogOpen(true)}>
          ＋ New breed
        </Button>
      </div>

      <NamedList
        label="Breeds"
        names={breeds.data ?? []}
        isLoading={breeds.isPending}
        limit={BACKEND_LIMIT}
        hasSearch={term.length > 0}
        emptyMessage="No breeds for this species yet."
      />

      <CreateBreedDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        species={species}
        initialName={search.trim()}
        onCreated={(breed) => {
          setDialogOpen(false)
          void queryClient.invalidateQueries({ queryKey: ['breeds'] })
          showToast({ tone: 'success', title: `${breed.name} is on the breed list` })
        }}
      />
    </div>
  )
}
