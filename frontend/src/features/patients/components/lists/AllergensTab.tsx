import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { Button, SearchInput, useToast } from '@/shared/ui'
import { searchAllergens } from '../../api/allergensApi'
import { CreateAllergenDialog } from '../pickers/CreateAllergenDialog'
import { NamedList } from './NamedList'
import styles from './ListTab.module.css'

const BACKEND_LIMIT = 20

export function AllergensTab() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const term = useDebouncedValue(search, 300).trim()

  const allergens = useQuery({
    queryKey: ['allergens', 'list', term],
    queryFn: () => searchAllergens(term),
    meta: { errorTitle: 'Could not load the allergens' },
  })

  return (
    <div className={styles.tab}>
      <div className={styles.bar}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search allergens" />
        <Button variant="primary" type="button" onClick={() => setDialogOpen(true)}>
          ＋ New allergen
        </Button>
      </div>

      <NamedList
        label="Allergens"
        names={allergens.data ?? []}
        isLoading={allergens.isPending}
        limit={BACKEND_LIMIT}
        hasSearch={term.length > 0}
        emptyMessage="No allergens yet."
      />

      <CreateAllergenDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialName={search.trim()}
        onCreated={(allergen) => {
          setDialogOpen(false)
          void queryClient.invalidateQueries({ queryKey: ['allergens'] })
          showToast({ tone: 'success', title: `${allergen.name} is on the allergen list` })
        }}
      />
    </div>
  )
}
