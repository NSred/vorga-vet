import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { isApiErrorCode } from '@/shared/lib/apiClient'
import { usePanelState } from '@/shared/lib/usePanelState'
import { Button, ConfirmDialog, layout, PageHeader, useToast } from '@/shared/ui'
import { useAuth } from '@/features/auth'
import { ExaminationEditPanel } from '@/features/examinations'
import type { Examination } from '@/features/examinations'
import {
  PeakHoursPanel,
  PeakHourTile,
  ScheduledTodayTile,
  StatGrid,
  TotalPatientsTile,
} from '@/widgets/dashboard'
import {
  parseFilterParams,
  patientDetailQuery,
  patientErrors,
  patientKeys,
  PatientFilters,
  PatientFormPanel,
  PatientTable,
  toFilterParams,
  useAllergenByName,
  useDeletePatient,
  usePatientsQuery,
} from '@/features/patients'
import { DiagnosisPicker } from '@/features/diagnoses'
import { PatientCardPanel } from '@/widgets/patientCard'
import { useVisitCharges } from '@/widgets/visit'
import type { PatientDetail, PatientFiltersType } from '@/features/patients'

type PanelState =
  | { mode: 'create' }
  | { mode: 'view'; patient: PatientDetail }
  | { mode: 'edit'; patient: PatientDetail }

export function PatientsPage() {
  const { showToast } = useToast()
  const { user } = useAuth()
  const isVeterinarian = user?.role === 'veterinarian'
  const [searchParams, setSearchParams] = useSearchParams()
  const { filters, allergenName, page, pageSize } = parseFilterParams(searchParams)

  const { panel, displayPanel, setPanel, closePanel } = usePanelState<PanelState>()
  const [peakHoursOpen, setPeakHoursOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [editingVisit, setEditingVisit] = useState<Examination | null>(null)
  const visitCharges = useVisitCharges({
    open: editingVisit !== null,
    examination: editingVisit ?? undefined,
  })

  const queryClient = useQueryClient()
  const remove = useDeletePatient()
  const { allergen, isPending: isAllergenPending } = useAllergenByName(allergenName)
  const activeFilters: PatientFiltersType = { ...filters, allergen }

  const patientsQuery = usePatientsQuery(activeFilters, page, pageSize, !isAllergenPending)

  const writeParams = useCallback(
    (nextFilters: PatientFiltersType, nextPage: number, nextPageSize: number) => {
      setSearchParams(toFilterParams(nextFilters, nextPage, nextPageSize), { replace: true })
    },
    [setSearchParams],
  )

  const openPatient = useCallback(
    (patientId: string) =>
      queryClient
        .query(patientDetailQuery(patientId))
        .then((patient) => setPanel({ mode: 'view', patient })),
    [queryClient, setPanel],
  )

  useEffect(() => {
    const patientId = searchParams.get('patient')
    if (!patientId) return

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('patient')
        return next
      },
      { replace: true },
    )

    openPatient(patientId).catch(() => undefined)
  }, [searchParams, setSearchParams, openPatient])

  const afterWrite = (title: string) => {
    closePanel()
    showToast({ tone: 'success', title })
  }

  const openRow = (patientId: string) =>
    openPatient(patientId).catch(() => {
      showToast({ tone: 'error', title: 'Could not open that patient' })
      void queryClient.invalidateQueries({ queryKey: patientKeys.all })
    })

  const handleDelete = (patientId: string) => {
    remove.mutate(patientId, {
      onSuccess: () => {
        setConfirmDeleteId(null)
        afterWrite('Patient deleted')
      },
      onError: (error) => {
        setConfirmDeleteId(null)
        if (isApiErrorCode(error, patientErrors.notFound, patientErrors.alreadyDeleted)) {
          afterWrite('Patient deleted')
          return
        }
        showToast({ tone: 'error', title: 'Could not delete that patient' })
      },
    })
  }

  return (
    <div className={layout.page}>
      <PageHeader
        title="Patient Records"
        subtitle="Overview and entry of animals, owners, and basic medical information."
        mobileActions="floating"
        actions={
          isVeterinarian && (
            <Button variant="primary" type="button" onClick={() => setPanel({ mode: 'create' })}>
              ＋ New patient
            </Button>
          )
        }
      />

      <StatGrid>
        <TotalPatientsTile />
        {isVeterinarian && <PeakHourTile onOpenBreakdown={() => setPeakHoursOpen(true)} />}
        {isVeterinarian && <ScheduledTodayTile />}
      </StatGrid>

      <PatientFilters filters={activeFilters} onChange={(next) => writeParams(next, 1, pageSize)} />

      <PatientTable
        patients={patientsQuery.data?.items ?? []}
        isLoading={patientsQuery.isLoading || isAllergenPending}
        page={page}
        pageSize={pageSize}
        totalCount={patientsQuery.data?.totalCount ?? 0}
        hasFilters={Boolean(
          filters.search || filters.species || filters.sex || filters.city || allergenName,
        )}
        onPageChange={(next) => writeParams(activeFilters, next, pageSize)}
        onPageSizeChange={(next) => writeParams(activeFilters, 1, next)}
        onRowClick={(patient) => void openRow(patient.id)}
        emptyMessage={
          isVeterinarian
            ? undefined
            : 'Your animals will appear here after their first visit to the clinic.'
        }
      />

      {displayPanel.mode === 'view' && (
        <PatientCardPanel
          patient={displayPanel.patient}
          open={panel.mode === 'view'}
          onOpenChange={(open) => !open && closePanel()}
          onEdit={() => setPanel({ mode: 'edit', patient: displayPanel.patient })}
          onDelete={() => setConfirmDeleteId(displayPanel.patient.id)}
          onEditVisit={setEditingVisit}
        />
      )}

      {isVeterinarian && displayPanel.mode === 'create' && (
        <PatientFormPanel
          mode="create"
          open={panel.mode === 'create'}
          onOpenChange={(open) => !open && closePanel()}
          onSaved={(patientName) => afterWrite(`${patientName} was created`)}
          onMissing={() => afterWrite('That patient no longer exists')}
        />
      )}

      {isVeterinarian && displayPanel.mode === 'edit' && (
        <PatientFormPanel
          key={displayPanel.patient.id}
          mode="edit"
          patient={displayPanel.patient}
          open={panel.mode === 'edit'}
          onOpenChange={(open) => !open && closePanel()}
          onSaved={(patientName) => afterWrite(`${patientName} was saved`)}
          onMissing={() => afterWrite('That patient no longer exists')}
        />
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="Delete this record?"
        description="The patient will be removed from the active list."
        confirmLabel="Delete"
        tone="danger"
        isPending={remove.isPending}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
      />

      {editingVisit && (
        <ExaminationEditPanel
          examination={editingVisit}
          costSlot={visitCharges}
          renderDiagnosis={(field) => <DiagnosisPicker {...field} />}
          open
          onOpenChange={(open) => !open && setEditingVisit(null)}
          onSaved={() => {
            setEditingVisit(null)
            showToast({ tone: 'success', title: 'Visit saved' })
          }}
          onMissing={(message) => {
            setEditingVisit(null)
            showToast({ tone: 'error', title: message })
          }}
        />
      )}

      {isVeterinarian && <PeakHoursPanel open={peakHoursOpen} onOpenChange={setPeakHoursOpen} />}
    </div>
  )
}
