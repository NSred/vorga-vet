import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { isApiErrorCode } from '@/shared/lib/apiClient'
import { Button, ConfirmDialog, useToast } from '@/shared/ui'
import { useAuth } from '@/features/auth'
import {
  PeakHoursPanel,
  PeakHourTile,
  ScheduledTodayTile,
  StatGrid,
  TotalPatientsTile,
} from '@/widgets/dashboard'
import {
  getPatient,
  parseFilterParams,
  patientErrors,
  patientKeys,
  PatientDetailPanel,
  PatientFilters,
  PatientFormPanel,
  PatientTable,
  toFilterParams,
  useAllergenByName,
  useDeletePatient,
  usePatientsQuery,
} from '@/features/patients'
import type {
  PatientDetail,
  PatientFiltersType,
  PatientListItem,
  PatientPage,
} from '@/features/patients'
import styles from './PatientsPage.module.css'

type PanelState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'view'; patient: PatientDetail }
  | { mode: 'edit'; patient: PatientDetail }

const EMPTY_PAGE: PatientPage = { items: [], totalCount: 0, page: 1, pageSize: 10 }

export function PatientsPage() {
  const { showToast } = useToast()
  const { user } = useAuth()
  const isVeterinarian = user?.role === 'veterinarian'
  const [searchParams, setSearchParams] = useSearchParams()
  const { filters, allergenName, page, pageSize } = parseFilterParams(searchParams)

  const [panel, setPanel] = useState<PanelState>({ mode: 'closed' })
  const [displayPanel, setDisplayPanel] = useState<PanelState>({ mode: 'closed' })
  if (panel.mode !== 'closed' && panel !== displayPanel) {
    setDisplayPanel(panel)
  }
  const [peakHoursOpen, setPeakHoursOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const remove = useDeletePatient()
  const { allergen, isPending: isAllergenPending } = useAllergenByName(allergenName)
  const activeFilters: PatientFiltersType = { ...filters, allergen }

  const patientsQuery = usePatientsQuery(activeFilters, page, pageSize, !isAllergenPending)
  const patientPage = patientsQuery.data ?? EMPTY_PAGE

  const writeParams = useCallback(
    (nextFilters: PatientFiltersType, nextPage: number, nextPageSize: number) => {
      setSearchParams(toFilterParams(nextFilters, nextPage, nextPageSize), { replace: true })
    },
    [setSearchParams],
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

    queryClient
      .query({
        queryKey: patientKeys.detail(patientId),
        queryFn: () => getPatient(patientId),
      })
      .then((patient) => setPanel({ mode: 'view', patient }))
      .catch(() => undefined)
  }, [searchParams, setSearchParams, queryClient])

  const closePanel = () => setPanel({ mode: 'closed' })

  const afterWrite = (title: string) => {
    closePanel()
    showToast({ tone: 'success', title })
  }

  const openPatient = (patient: PatientListItem) => {
    queryClient
      .query({
        queryKey: patientKeys.detail(patient.id),
        queryFn: () => getPatient(patient.id),
      })
      .then((detail) => setPanel({ mode: 'view', patient: detail }))
      .catch(() => {
        showToast({ tone: 'error', title: 'Could not open that patient' })
        queryClient.invalidateQueries({ queryKey: patientKeys.all })
      })
  }

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
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Patient Records</h1>
          <p className={styles.subtitle}>
            Overview and entry of animals, owners, and basic medical information.
          </p>
        </div>
        {isVeterinarian && (
          <Button variant="primary" type="button" onClick={() => setPanel({ mode: 'create' })}>
            ＋ New patient
          </Button>
        )}
      </div>

      <StatGrid>
        <TotalPatientsTile />
        {isVeterinarian && <PeakHourTile onOpenBreakdown={() => setPeakHoursOpen(true)} />}
        {isVeterinarian && <ScheduledTodayTile />}
      </StatGrid>

      <PatientFilters filters={activeFilters} onChange={(next) => writeParams(next, 1, pageSize)} />

      <PatientTable
        patients={patientPage.items}
        isLoading={patientsQuery.isLoading || isAllergenPending}
        page={page}
        pageSize={pageSize}
        totalCount={patientPage.totalCount}
        hasFilters={Boolean(
          filters.search || filters.species || filters.sex || filters.city || allergenName,
        )}
        onPageChange={(next) => writeParams(activeFilters, next, pageSize)}
        onPageSizeChange={(next) => writeParams(activeFilters, 1, next)}
        onRowClick={openPatient}
        emptyMessage={
          isVeterinarian
            ? undefined
            : 'Your animals will appear here after their first visit to the clinic.'
        }
      />

      {displayPanel.mode === 'view' && (
        <PatientDetailPanel
          patient={displayPanel.patient}
          open={panel.mode === 'view'}
          onOpenChange={(open) => !open && closePanel()}
          onEdit={
            isVeterinarian
              ? () => setPanel({ mode: 'edit', patient: displayPanel.patient })
              : undefined
          }
          onDelete={isVeterinarian ? () => setConfirmDeleteId(displayPanel.patient.id) : undefined}
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

      {isVeterinarian && <PeakHoursPanel open={peakHoursOpen} onOpenChange={setPeakHoursOpen} />}
    </div>
  )
}
