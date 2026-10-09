import { usePanelState } from '@/shared/lib/usePanelState'
import { useSearchParams } from 'react-router'
import { Button, ConfirmDialog, layout, PageHeader, useRetireRestore, useToast } from '@/shared/ui'
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
import type { ParsedPriceListParams, PriceListItem } from '@/features/priceList'

type PanelState = { mode: 'create' } | { mode: 'edit'; item: PriceListItem }

export function PriceListPage() {
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const view = parsePriceListParams(searchParams)
  const { kind, filters, page, pageSize } = view

  const { panel, displayPanel, setPanel, closePanel } = usePanelState<PanelState>()

  const listQuery = usePriceListQuery(kind, filters, page, pageSize)
  const retire = useRetirePriceListItem()
  const restore = useRestorePriceListItem()

  const writeView = (next: ParsedPriceListParams) =>
    setSearchParams(toPriceListParams(next), { replace: true })

  const afterWrite = (title: string) => {
    closePanel()
    showToast({ tone: 'success', title })
  }

  const status = useRetireRestore<PriceListItem>({
    retire: (item) => retire.mutateAsync({ kind: item.kind, id: item.id }),
    restore: (item) => restore.mutateAsync({ kind: item.kind, id: item.id }),
    nameOf: (item) => item.name,
    onDone: afterWrite,
  })

  const isMedication = kind === 'medication'

  return (
    <div className={layout.page}>
      <PageHeader
        title="Price list"
        subtitle="Services and medications the clinic charges for, with their prices in dinars."
        actions={
          <Button
            variant="primary"
            type="button"
            shortcut="n"
            onClick={() => setPanel({ mode: 'create' })}
          >
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
        items={listQuery.data?.items ?? []}
        isLoading={listQuery.isLoading}
        page={page}
        pageSize={pageSize}
        totalCount={listQuery.data?.totalCount ?? 0}
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
          onRetire={() => status.askRetire(displayPanel.item)}
          onRestore={() => status.restore(displayPanel.item)}
          isStatusPending={status.isPending}
        />
      )}

      <ConfirmDialog
        open={status.confirming !== null}
        onOpenChange={(open) => !open && status.cancelRetire()}
        title={`Retire ${status.confirming?.name ?? 'this item'}?`}
        description="It will no longer be offered. It stays under Retired and can be restored at any time."
        confirmLabel="Retire"
        tone="danger"
        isPending={status.isPending}
        onConfirm={status.confirmRetire}
      />
    </div>
  )
}
