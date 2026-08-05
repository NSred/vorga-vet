import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Button } from '@/shared/ui'
import { PatientDetailPanel } from '../components/PatientDetailPanel'
import { PatientFilters } from '../components/PatientFilters'
import { PatientFormPanel } from '../components/PatientFormPanel'
import { PatientTable } from '../components/PatientTable'
import { StatCards } from '../components/StatCards'
import { getPatients, createPatient, updatePatient, softDeletePatient } from '../api/patientsApi'
import { getDashboardStats, type DashboardStats } from '../api/statsApi'
import type { Patient, PatientFilters as PatientFiltersType, PatientInput } from '../types'
import styles from './KartotekaPage.module.css'

type PanelState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'view'; patient: Patient }
  | { mode: 'edit'; patient: Patient }

export function KartotekaPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<PatientFiltersType>({ status: 'aktivan' })
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoadingPatients, setIsLoadingPatients] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [panel, setPanel] = useState<PanelState>({ mode: 'closed' })

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

  const handleCreateSubmit = async (input: PatientInput) => {
    await createPatient(input)
    closePanel()
    refreshPatients(filters)
    refreshStats()
  }

  const handleEditSubmit = async (input: PatientInput) => {
    if (panel.mode !== 'edit') return
    await updatePatient(panel.patient.id, input)
    closePanel()
    refreshPatients(filters)
    refreshStats()
  }

  const handleDelete = async (patientId: string) => {
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovaj karton?')) {
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
          <h1 className={styles.title}>Kartoteka pacijenata</h1>
          <p className={styles.subtitle}>Pregled i unos životinja, vlasnika i osnovnih medicinskih podataka.</p>
        </div>
        <Button variant="primary" type="button" onClick={() => setPanel({ mode: 'create' })}>
          ＋ Novi pacijent
        </Button>
      </div>

      <StatCards stats={stats} isLoading={isLoadingStats} />

      <PatientFilters filters={filters} onChange={setFilters} />

      <PatientTable
        patients={patients}
        isLoading={isLoadingPatients}
        onRowClick={(patient) => setPanel({ mode: 'view', patient })}
      />

      {panel.mode === 'view' && (
        <PatientDetailPanel
          patient={panel.patient}
          open
          onOpenChange={(open) => !open && closePanel()}
          onEdit={() => setPanel({ mode: 'edit', patient: panel.patient })}
          onDelete={() => handleDelete(panel.patient.id)}
        />
      )}

      {panel.mode === 'create' && (
        <PatientFormPanel
          open
          onOpenChange={(open) => !open && closePanel()}
          mode="create"
          onSubmit={handleCreateSubmit}
        />
      )}

      {panel.mode === 'edit' && (
        <PatientFormPanel
          open
          onOpenChange={(open) => !open && closePanel()}
          mode="edit"
          initialPatient={panel.patient}
          onSubmit={handleEditSubmit}
          onDelete={() => handleDelete(panel.patient.id)}
        />
      )}
    </div>
  )
}
