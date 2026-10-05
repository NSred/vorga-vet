import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { usePanelState } from '@/shared/lib/usePanelState'
import { useSearchDraft } from '@/shared/lib/useSearchDraft'
import { Button, ConfirmDialog, SearchInput, SegmentedControl, useToast } from '@/shared/ui'
import { useDiagnosesQuery } from '../hooks/useDiagnosesQuery'
import { useRestoreDiagnosis, useRetireDiagnosis } from '../hooks/useDiagnosisMutations'
import {
  parseDiagnosisParams,
  writeDiagnosisParams,
  type ParsedDiagnosisParams,
} from '../lib/diagnosisParams'
import type { Diagnosis, DiagnosisPage } from '../types'
import { DiagnosisPanel } from './DiagnosisPanel'
import { DiagnosisTable } from './DiagnosisTable'
import { ImportDiagnosesDialog } from './ImportDiagnosesDialog'
import styles from './DiagnosesTab.module.css'

type PanelState = { mode: 'create' } | { mode: 'edit'; diagnosis: Diagnosis }

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'all', label: 'All' },
  { value: 'retired', label: 'Retired' },
] as const

const EMPTY_PAGE: DiagnosisPage = { items: [], totalCount: 0, page: 1, pageSize: 25 }

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}

export function DiagnosesTab() {
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const view = parseDiagnosisParams(searchParams)
  const { filters, page, pageSize } = view

  const { panel, displayPanel, setPanel, closePanel } = usePanelState<PanelState>()
  const [confirmRetire, setConfirmRetire] = useState<Diagnosis | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const listQuery = useDiagnosesQuery(filters, page, pageSize)
  const listPage = listQuery.data ?? EMPTY_PAGE
  const retire = useRetireDiagnosis()
  const restore = useRestoreDiagnosis()

  const writeView = (next: ParsedDiagnosisParams) =>
    setSearchParams((prev) => writeDiagnosisParams(prev, next), { replace: true })

  const [searchDraft, setSearchDraft] = useSearchDraft(filters.search ?? '', (search) =>
    writeView({ filters: { ...filters, search: search || undefined }, page: 1, pageSize }),
  )

  const afterWrite = (title: string) => {
    closePanel()
    showToast({ tone: 'success', title })
  }

  const handleRetire = (diagnosis: Diagnosis) => {
    retire.mutate(diagnosis.id, {
      onSuccess: () => {
        setConfirmRetire(null)
        afterWrite(`${diagnosis.name} was retired`)
      },
      onError: () => {
        setConfirmRetire(null)
        showToast({ tone: 'error', title: `Could not retire ${diagnosis.name}` })
      },
    })
  }

  const handleRestore = (diagnosis: Diagnosis) => {
    restore.mutate(diagnosis.id, {
      onSuccess: () => afterWrite(`${diagnosis.name} was restored`),
      onError: () => showToast({ tone: 'error', title: `Could not restore ${diagnosis.name}` }),
    })
  }

  return (
    <div className={styles.tab}>
      <div className={styles.bar}>
        <div className={styles.group}>
          <SearchInput
            value={searchDraft}
            onChange={setSearchDraft}
            placeholder="Search diagnoses"
          />
          <SegmentedControl
            value={filters.status}
            onChange={(status) => writeView({ filters: { ...filters, status }, page: 1, pageSize })}
            options={STATUS_OPTIONS}
          />
        </div>
        <div className={styles.group}>
          <Button variant="outline" type="button" onClick={() => setImportOpen(true)}>
            Paste a list
          </Button>
          <Button variant="primary" type="button" onClick={() => setPanel({ mode: 'create' })}>
            ＋ New diagnosis
          </Button>
        </div>
      </div>

      <DiagnosisTable
        diagnoses={listPage.items}
        isLoading={listQuery.isLoading}
        page={page}
        pageSize={pageSize}
        totalCount={listPage.totalCount}
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
          onRetire={() => setConfirmRetire(displayPanel.diagnosis)}
          onRestore={() => handleRestore(displayPanel.diagnosis)}
          isStatusPending={retire.isPending || restore.isPending}
        />
      )}

      <ConfirmDialog
        open={confirmRetire !== null}
        onOpenChange={(open) => !open && setConfirmRetire(null)}
        title={`Retire ${confirmRetire?.name ?? 'this diagnosis'}?`}
        description="It will no longer be offered on exams. Exams that already use it keep their text, and it can be restored at any time."
        confirmLabel="Retire"
        tone="danger"
        isPending={retire.isPending}
        onConfirm={() => confirmRetire && handleRetire(confirmRetire)}
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
