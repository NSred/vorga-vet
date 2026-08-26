import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Button, useToast } from '@/shared/ui'
import { PatientCreatePanel } from '../components/PatientCreatePanel'
import { PatientDetailPanel } from '../components/PatientDetailPanel'
import { PatientFilters } from '../components/PatientFilters'
import { PatientFormPanel } from '../components/PatientFormPanel'
import { PatientTable } from '../components/PatientTable'
import { PeakHoursPanel } from '../components/PeakHoursPanel'
import { StatCards } from '../components/StatCards'
import { getPatients, updatePatient, softDeletePatient } from '../api/patientsApi'
import { getDashboardStats, type DashboardStats } from '../api/statsApi'
import type { Patient, PatientFilters as PatientFiltersType, PatientInput } from '../types'
import styles from './PatientsPage.module.css'

type PanelState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'view'; patient: Patient }
  | { mode: 'edit'; patient: Patient }

export function PatientsPage() {
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<PatientFiltersType>({ status: 'active' })
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoadingPatients, setIsLoadingPatients] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [panel, setPanel] = useState<PanelState>({ mode: 'closed' })
  const [displayPanel, setDisplayPanel] = useState<PanelState>({ mode: 'closed' })
  if (panel.mode !== 'closed' && panel !== displayPanel) {
    setDisplayPanel(panel)
  }
  const [peakHoursOpen, setPeakHoursOpen] = useState(false)

  const refreshPatients = useCallback((nextFilters: PatientFiltersType) => {
    setIsLoadingPatients(true)
    getPatients(nextFilters)
      .then(setPatients)
      .finally(() => setIsLoadingPatients(false))
  }, [])

  const refreshStats = useCallback(() => {
    setIsLoadingStats(true)
    getDashboardStats()
      .then(setStats)
      .finally(() => setIsLoadingStats(false))
  }, [])

  useEffect(() => {
    refreshPatients(filters)
  }, [filters, refreshPatients])

  useEffect(() => {
    refreshStats()
  }, [refreshStats])

  useEffect(() => {
    const patientId = searchParams.get('patient')
    if (!patientId) return
    const found = patients.find((patient) => patient.id === patientId)
    if (found) {
      setPanel({ mode: 'view', patient: found })
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('patient')
          return next
        },
        { replace: true },
      )
    }
  }, [searchParams, patients, setSearchParams])

  const closePanel = () => setPanel({ mode: 'closed' })

  const handleEditSubmit = async (input: PatientInput) => {
    if (panel.mode !== 'edit') return
    await updatePatient(panel.patient.id, input)
    closePanel()
    refreshPatients(filters)
    refreshStats()
  }

  const handleDelete = async (patientId: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return
    }
    await softDeletePatient(patientId)
    closePanel()
    refreshPatients(filters)
    refreshStats()
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

      <PatientFilters filters={filters} onChange={setFilters} />

      <PatientTable
        patients={patients}
        isLoading={isLoadingPatients}
        onRowClick={(patient) => setPanel({ mode: 'view', patient })}
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
        <PatientCreatePanel
          open={panel.mode === 'create'}
          onOpenChange={(open) => !open && closePanel()}
          onCreated={(patientName) => {
            closePanel()
            showToast({
              tone: 'success',
              title: `${patientName} was created`,
              description:
                'The patient list still shows sample data, so the new record is not in the table yet.',
            })
          }}
        />
      )}

      {displayPanel.mode === 'edit' && (
        <PatientFormPanel
          open={panel.mode === 'edit'}
          onOpenChange={(open) => !open && closePanel()}
          mode="edit"
          initialPatient={displayPanel.patient}
          onSubmit={handleEditSubmit}
          onDelete={() => handleDelete(displayPanel.patient.id)}
        />
      )}

      <PeakHoursPanel open={peakHoursOpen} onOpenChange={setPeakHoursOpen} />
    </div>
  )
}
