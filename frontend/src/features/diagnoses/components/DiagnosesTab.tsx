import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { usePanelState } from '@/shared/lib/usePanelState'
import { useSearchDraft } from '@/shared/lib/useSearchDraft'
import { plural } from '@/shared/lib/text'
import {
  Button,
  CATALOG_STATUS_OPTIONS,
  ConfirmDialog,
  layout,
  SearchInput,
  SegmentedControl,
  useRetireRestore,
  useToast,
} from '@/shared/ui'
import { useDiagnosesQuery } from '../hooks/useDiagnosesQuery'
import { useRestoreDiagnosis, useRetireDiagnosis } from '../hooks/useDiagnosisMutations'
import {
  parseDiagnosisParams,
  writeDiagnosisParams,
  type ParsedDiagnosisParams,
} from '../lib/diagnosisParams'
import type { Diagnosis } from '../types'
import { DiagnosisPanel } from './DiagnosisPanel'
import { DiagnosisTable } from './DiagnosisTable'
import { ImportDiagnosesDialog } from './ImportDiagnosesDialog'

type PanelState = { mode: 'create' } | { mode: 'edit'; diagnosis: Diagnosis }

export function DiagnosesTab() {
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const view = parseDiagnosisParams(searchParams)
  const { filters, page, pageSize } = view

  const { panel, displayPanel, setPanel, closePanel } = usePanelState<PanelState>()
  const [importOpen, setImportOpen] = useState(false)

  const listQuery = useDiagnosesQuery(filters, page, pageSize)
  const retire = useRetireDiagnosis()
  const restore = useRestoreDiagnosis()

  const afterWrite = (title: string) => {
    closePanel()
    showToast({ tone: 'success', title })
  }

  const status = useRetireRestore<Diagnosis>({
    retire: (diagnosis) => retire.mutateAsync(diagnosis.id),
    restore: (diagnosis) => restore.mutateAsync(diagnosis.id),
    nameOf: (diagnosis) => diagnosis.name,
    onDone: afterWrite,
  })

  const writeView = (next: ParsedDiagnosisParams) =>
    setSearchParams((prev) => writeDiagnosisParams(prev, next), { replace: true })

  const [searchDraft, setSearchDraft] = useSearchDraft(filters.search ?? '', (search) =>
    writeView({ filters: { ...filters, search: search || undefined }, page: 1, pageSize }),
  )

  return (
    <div className={layout.stack}>
      <div className={layout.toolbar}>
        <div className={layout.toolbarGroup}>
          <SearchInput
            value={searchDraft}
            onChange={setSearchDraft}
            placeholder="Search diagnoses"
          />
          <SegmentedControl
            value={filters.status}
            onChange={(next) =>
              writeView({ filters: { ...filters, status: next }, page: 1, pageSize })
            }
            options={CATALOG_STATUS_OPTIONS}
          />
        </div>
        <div className={layout.toolbarGroup}>
          <Button variant="outline" type="button" onClick={() => setImportOpen(true)}>
            Paste a list
          </Button>
          <Button
            variant="primary"
            type="button"
            shortcut="n"
            onClick={() => setPanel({ mode: 'create' })}
          >
            ＋ New diagnosis
          </Button>
        </div>
      </div>

      <DiagnosisTable
        diagnoses={listQuery.data?.items ?? []}
        isLoading={listQuery.isLoading}
        page={page}
        pageSize={pageSize}
        totalCount={listQuery.data?.totalCount ?? 0}
        hasSearch={Boolean(filters.search)}
        onPageChange={(nextPage) => writeView({ ...view, page: nextPage })}
        onPageSizeChange={(nextSize) => writeView({ ...view, page: 1, pageSize: nextSize })}
        onRowClick={(diagnosis) => setPanel({ mode: 'edit', diagnosis })}
      />

      {displayPanel.mode === 'create' && (
        <DiagnosisPanel
          mode="create"
          open={panel.mode === 'create'}
          onOpenChange={(open) => !open && closePanel()}
          onSaved={(name) => afterWrite(`${name} was added`)}
          onMissing={closePanel}
        />
      )}

      {displayPanel.mode === 'edit' && (
        <DiagnosisPanel
          key={displayPanel.diagnosis.id}
          mode="edit"
          diagnosis={displayPanel.diagnosis}
          open={panel.mode === 'edit'}
          onOpenChange={(open) => !open && closePanel()}
          onSaved={(name) => afterWrite(`${name} was saved`)}
          onMissing={() => afterWrite('That diagnosis no longer exists')}
          onRetire={() => status.askRetire(displayPanel.diagnosis)}
          onRestore={() => status.restore(displayPanel.diagnosis)}
          isStatusPending={status.isPending}
        />
      )}

      <ConfirmDialog
        open={status.confirming !== null}
        onOpenChange={(open) => !open && status.cancelRetire()}
        title={`Retire ${status.confirming?.name ?? 'this diagnosis'}?`}
        description="It will no longer be offered on exams. Exams that already use it keep their text, and it can be restored at any time."
        confirmLabel="Retire"
        tone="danger"
        isPending={status.isPending}
        onConfirm={status.confirmRetire}
      />

      <ImportDiagnosesDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={({ added, skipped }) => {
          setImportOpen(false)
          showToast({
            tone: 'success',
            title: `${plural(added, 'diagnosis', 'diagnoses')} added, ${skipped} skipped`,
          })
        }}
      />
    </div>
  )
}
