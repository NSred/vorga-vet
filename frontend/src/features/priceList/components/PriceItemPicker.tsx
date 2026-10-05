import { useState } from 'react'
import { formatPrice } from '@/shared/lib/money'
import { searchComboboxProps } from '@/shared/lib/useEntitySearch'
import { Combobox } from '@/shared/ui'
import { usePriceListSearch } from '../hooks/usePriceListSearch'
import type { PriceListItem, PriceListKind } from '../types'
import { CreatePriceItemDialog } from './CreatePriceItemDialog'

export interface PriceItemPickerProps {
  kind: PriceListKind
  onPick: (item: PriceListItem) => void
}

const COPY: Record<
  PriceListKind,
  { label: string; placeholder: string; create: string; empty: string }
> = {
  service: {
    label: 'Add service',
    placeholder: 'Search services…',
    create: 'Create service',
    empty: 'No services match',
  },
  medication: {
    label: 'Add medication',
    placeholder: 'Search medications…',
    create: 'Create medication',
    empty: 'No medications match',
  },
}

function hintOf(item: PriceListItem): string {
  const price = formatPrice(item.price)
  return item.unit ? `${price} / ${item.unit}` : price
}

export function PriceItemPicker({ kind, onPick }: PriceItemPickerProps) {
  const search = usePriceListSearch(kind)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingName, setPendingName] = useState('')
  const copy = COPY[kind]

  return (
    <>
      <Combobox
        id={`add-${kind}`}
        label={copy.label}
        triggerText=""
        placeholder={copy.placeholder}
        {...searchComboboxProps(search)}
        options={search.results.map((item) => ({
          id: item.id,
          label: item.name,
          hint: hintOf(item),
        }))}
        onSelect={(option) => {
          const item = search.results.find((candidate) => candidate.id === option.id)
          if (item) onPick(item)
          search.setQuery('')
        }}
        onCreate={(typed) => {
          setPendingName(typed)
          setDialogOpen(true)
        }}
        createLabel={copy.create}
        emptyMessage={copy.empty}
      />

      <CreatePriceItemDialog
        kind={kind}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialName={pendingName}
        onCreated={(item) => {
          onPick(item)
          search.setQuery('')
          setDialogOpen(false)
        }}
      />
    </>
  )
}
