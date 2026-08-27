import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ApiError } from '@/shared/lib/apiClient'
import { Button, useToast } from '@/shared/ui'
import { PatientDetailPanel } from '../components/PatientDetailPanel'
import { PatientFilters } from '../components/PatientFilters'
import { PatientFormPanel } from '../components/PatientFormPanel'
import { PatientTable } from '../components/PatientTable'
import { PeakHoursPanel } from '../components/PeakHoursPanel'
import { StatCards } from '../components/StatCards'
import { searchAllergens } from '../api/allergensApi'
import { deletePatient, getPatient, getPatients } from '../api/patientsApi'
import { getDashboardStats, type DashboardStats } from '../api/statsApi'
import { parseFilterParams, toFilterParams } from '../lib/patientFilterParams'
import type {
  AllergenOption,
  PatientDetail,
  PatientFilters as PatientFiltersType,
  PatientListItem,
  PatientPage,
} from '../types'
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

  const [allergenResolution, setAllergenResolution] = useState<{
    name: string
    option: AllergenOption | null
  } | null>(null)
  const [patientPage, setPatientPage] = useState<PatientPage>(EMPTY_PAGE)
  const [isLoadingPatients, setIsLoadingPatients] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [panel, setPanel] = useState<PanelState>({ mode: 'closed' })
  const [displayPanel, setDisplayPanel] = useState<PanelState>({ mode: 'closed' })
  if (panel.mode !== 'closed' && panel !== displayPanel) {
    setDisplayPanel(panel)
  }
  const [peakHoursOpen, setPeakHoursOpen] = useState(false)
  const latestRequest = useRef(0)

  const isAllergenPending = Boolean(allergenName) && allergenResolution?.name !== allergenName
  const allergen = isAllergenPending ? null : (allergenResolution?.option ?? null)
  const activeFilters: PatientFiltersType = { ...filters, allergen }

  const writeParams = useCallback(
    (nextFilters: PatientFiltersType, nextPage: number, nextPageSize: number) => {
      setSearchParams(toFilterParams(nextFilters, nextPage, nextPageSize), { replace: true })
    },
    [setSearchParams],
  )

  useEffect(() => {
    if (!allergenName) {
      setAllergenResolution(null)
      return
    }
    if (allergenResolution?.name === allergenName) return

    let cancelled = false
    searchAllergens(allergenName)
      .then((results) => {
        if (cancelled) return
        const match = results.find(
          (candidate) => candidate.name.toLowerCase() === allergenName.toLowerCase(),
        )
        setAllergenResolution({ name: allergenName, option: match ?? null })
      })
      .catch(() => {
        if (!cancelled) setAllergenResolution({ name: allergenName, option: null })
      })

    return () => {
      cancelled = true
    }
  }, [allergenName, allergenResolution])

  const refreshStats = useCallback(() => {
    setIsLoadingStats(true)
    getDashboardStats()
      .then(setStats)
      .finally(() => setIsLoadingStats(false))
  }, [])

  const searchKey = JSON.stringify([filters, allergen?.id, page, pageSize])

  const loadPatients = useCallback(() => {
    if (isAllergenPending) return

    const requestId = ++latestRequest.current
    setIsLoadingPatients(true)

    getPatients(activeFilters, page, pageSize)
      .then((result) => {
        if (requestId !== latestRequest.current) return
        setPatientPage(result)
      })
      .catch(() => {
        if (requestId !== latestRequest.current) return
        setPatientPage(EMPTY_PAGE)
        showToast({ tone: 'error', title: 'Could not load patients' })
      })
      .finally(() => {
        if (requestId === latestRequest.current) setIsLoadingPatients(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey, isAllergenPending, showToast])

  useEffect(loadPatients, [loadPatients])

  useEffect(() => {
    refreshStats()
  }, [refreshStats])

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

    getPatient(patientId)
      .then((patient) => setPanel({ mode: 'view', patient }))
      .catch(() => undefined)
  }, [searchParams, setSearchParams])

  const closePanel = () => setPanel({ mode: 'closed' })

  const afterWrite = (title: string) => {
    closePanel()
    loadPatients()
    refreshStats()
    showToast({ tone: 'success', title })
  }

  const openPatient = (patient: PatientListItem) => {
    getPatient(patient.id)
      .then((detail) => setPanel({ mode: 'view', patient: detail }))
      .catch(() => {
        showToast({ tone: 'error', title: 'Could not open that patient' })
        loadPatients()
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

      <StatCards stats={stats} isLoading={isLoadingStats} onPeakHoursClick={() => setPeakHoursOpen(true)} />

      <PatientFilters filters={activeFilters} onChange={(next) => writeParams(next, 1, pageSize)} />

      <PatientTable
        patients={patientPage.items}
        isLoading={isLoadingPatients || isAllergenPending}
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
