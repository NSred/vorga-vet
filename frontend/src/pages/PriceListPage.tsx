import { useState } from 'react'
import { usePanelState } from '@/shared/lib/usePanelState'
import { useSearchParams } from 'react-router'
import { Button, ConfirmDialog, PageHeader, useToast } from '@/shared/ui'
import {
  parsePriceListParams,
  PriceItemPanel,
  PriceListTable,
  PriceListToolbar,
  toPriceListParams,
  usePriceListQuery,
  useRestorePriceListItem,
  useRetirePriceListItem,
} from '@/features/priceList'
import type { ParsedPriceListParams, PriceListItem, PriceListPage } from '@/features/priceList'
import styles from './PriceListPage.module.css'

type PanelState = { mode: 'create' } | { mode: 'edit'; item: PriceListItem }

const EMPTY_PAGE: PriceListPage = { items: [], totalCount: 0, page: 1, pageSize: 25 }

export function PriceListPage() {
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const view = parsePriceListParams(searchParams)
  const { kind, filters, page, pageSize } = view

  const { panel, displayPanel, setPanel, closePanel } = usePanelState<PanelState>()
  const [confirmRetire, setConfirmRetire] = useState<PriceListItem | null>(null)

  const listQuery = usePriceListQuery(kind, filters, page, pageSize)
  const listPage = listQuery.data ?? EMPTY_PAGE
  const retire = useRetirePriceListItem()
  const restore = useRestorePriceListItem()

  const writeView = (next: ParsedPriceListParams) =>
    setSearchParams(toPriceListParams(next), { replace: true })

  const afterWrite = (title: string) => {
    closePanel()
    showToast({ tone: 'success', title })
  }

  const handleRetire = (item: PriceListItem) => {
    retire.mutate(
      { kind: item.kind, id: item.id },
      {
        onSuccess: () => {
          setConfirmRetire(null)
          afterWrite(`${item.name} was retired`)
        },
        onError: () => {
          setConfirmRetire(null)
          showToast({ tone: 'error', title: `Could not retire ${item.name}` })
        },
      },
    )
  }

  const handleRestore = (item: PriceListItem) => {
    restore.mutate(
      { kind: item.kind, id: item.id },
      {
        onSuccess: () => afterWrite(`${item.name} was restored`),
        onError: () => showToast({ tone: 'error', title: `Could not restore ${item.name}` }),
      },
    )
  }

  const isMedication = kind === 'medication'

  return (
    <div className={styles.page}>
      <PageHeader
        title="Price list"
        subtitle="Services and medications the clinic charges for, with their prices in dinars."
        actions={
          <Button variant="primary" type="button" onClick={() => setPanel({ mode: 'create' })}>
            {isMedication ? '＋ New medication' : '＋ New service'}
          </Button>
        }
      />

      <PriceListToolbar
        kind={kind}
        filters={filters}
        onKindChange={(nextKind) =>
          writeView({ kind: nextKind, filters: { status: filters.status }, page: 1, pageSize })
        }
        onFiltersChange={(nextFilters) =>
          writeView({ kind, filters: nextFilters, page: 1, pageSize })
        }
      />

      <PriceListTable
        kind={kind}
        items={listPage.items}
        isLoading={listQuery.isLoading}
        page={page}
        pageSize={pageSize}
        totalCount={listPage.totalCount}
        hasSearch={Boolean(filters.search)}
        onPageChange={(nextPage) => writeView({ ...view, page: nextPage })}
        onPageSizeChange={(nextSize) => writeView({ ...view, page: 1, pageSize: nextSize })}
        onRowClick={(item) => setPanel({ mode: 'edit', item })}
      />

      {displayPanel.mode === 'create' && (
        <PriceItemPanel
          key={`create-${kind}`}
          mode="create"
          kind={kind}
          open={panel.mode === 'create'}
          onOpenChange={(open) => !open && closePanel()}
          onSaved={(name) => afterWrite(`${name} was added`)}
          onMissing={closePanel}
        />
      )}

      {displayPanel.mode === 'edit' && (
        <PriceItemPanel
          key={displayPanel.item.id}
          mode="edit"
          kind={displayPanel.item.kind}
          item={displayPanel.item}
          open={panel.mode === 'edit'}
          onOpenChange={(open) => !open && closePanel()}
          onSaved={(name) => afterWrite(`${name} was saved`)}
          onMissing={() => afterWrite('That item no longer exists')}
          onRetire={() => setConfirmRetire(displayPanel.item)}
          onRestore={() => handleRestore(displayPanel.item)}
          isStatusPending={retire.isPending || restore.isPending}
        />
      )}

      <ConfirmDialog
        open={confirmRetire !== null}
        onOpenChange={(open) => !open && setConfirmRetire(null)}
        title={`Retire ${confirmRetire?.name ?? 'this item'}?`}
        description="It will no longer be offered. It stays under Retired and can be restored at any time."
        confirmLabel="Retire"
        tone="danger"
        isPending={retire.isPending}
        onConfirm={() => confirmRetire && handleRetire(confirmRetire)}
      />
    </div>
  )
}
