import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ApiError } from '@/shared/lib/apiClient'
import { Button, useToast } from '@/shared/ui'
import {
  PeakHoursPanel,
  PeakHourTile,
  ScheduledTodayTile,
  StatGrid,
  TotalPatientsTile,
} from '@/widgets/dashboard'
import {
  deletePatient,
  getPatient,
  parseFilterParams,
  patientKeys,
  PatientDetailPanel,
  PatientFilters,
  PatientFormPanel,
  PatientTable,
  toFilterParams,
  useAllergenByName,
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
  const [searchParams, setSearchParams] = useSearchParams()
  const { filters, allergenName, page, pageSize } = parseFilterParams(searchParams)

  const [panel, setPanel] = useState<PanelState>({ mode: 'closed' })
  const [displayPanel, setDisplayPanel] = useState<PanelState>({ mode: 'closed' })
  if (panel.mode !== 'closed' && panel !== displayPanel) {
    setDisplayPanel(panel)
  }
  const [peakHoursOpen, setPeakHoursOpen] = useState(false)

  const queryClient = useQueryClient()
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
    if (patientsQuery.isError) {
      showToast({ tone: 'error', title: 'Could not load patients' })
    }
  }, [patientsQuery.isError, showToast])

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
    queryClient.invalidateQueries({ queryKey: patientKeys.all })
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

  const handleDelete = async (patientId: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return
    }

    try {
      await deletePatient(patientId)
    } catch (error: unknown) {
      const alreadyGone =
        error instanceof ApiError &&
        (error.code === 'Patients.NotFound' || error.code === 'Patients.AlreadyDeleted')

      if (!alreadyGone) {
        showToast({ tone: 'error', title: 'Could not delete that patient' })
        return
      }
    }

    afterWrite('Patient deleted')
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Patient Records</h1>
          <p className={styles.subtitle}>Overview and entry of animals, owners, and basic medical information.</p>
        </div>
        <Button variant="primary" type="button" onClick={() => setPanel({ mode: 'create' })}>
          ＋ New patient
        </Button>
      </div>

      <StatGrid>
        <TotalPatientsTile />
        <PeakHourTile onOpenBreakdown={() => setPeakHoursOpen(true)} />
        <ScheduledTodayTile />
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
      />

      {displayPanel.mode === 'view' && (
        <PatientDetailPanel
          patient={displayPanel.patient}
          open={panel.mode === 'view'}
          onOpenChange={(open) => !open && closePanel()}
          onEdit={() => setPanel({ mode: 'edit', patient: displayPanel.patient })}
          onDelete={() => handleDelete(displayPanel.patient.id)}
        />
      )}

      {displayPanel.mode === 'create' && (
        <PatientFormPanel
          mode="create"
          open={panel.mode === 'create'}
          onOpenChange={(open) => !open && closePanel()}
          onSaved={(patientName) => afterWrite(`${patientName} was created`)}
          onMissing={() => afterWrite('That patient no longer exists')}
        />
      )}

      {displayPanel.mode === 'edit' && (
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

      <PeakHoursPanel open={peakHoursOpen} onOpenChange={setPeakHoursOpen} />
    </div>
  )
}
