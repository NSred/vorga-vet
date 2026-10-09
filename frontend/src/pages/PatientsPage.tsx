import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'
import { usePanelState } from '@/shared/lib/usePanelState'
import { Button, layout, PageHeader, useToast } from '@/shared/ui'
import { useAuth } from '@/features/auth'
import {
  PeakHoursPanel,
  PeakHourTile,
  ScheduledTodayTile,
  StatGrid,
  TotalPatientsTile,
} from '@/widgets/dashboard'
import {
  parseFilterParams,
  PatientFilters,
  PatientFormPanel,
  PatientTable,
  toFilterParams,
  useAllergenByName,
  usePatientsQuery,
} from '@/features/patients'
import { PatientRecord } from '@/widgets/patientCard'
import type { PatientFiltersType } from '@/features/patients'

type PanelState = { mode: 'create' }

export function PatientsPage() {
  const { showToast } = useToast()
  const { user } = useAuth()
  const isVeterinarian = user?.role === 'veterinarian'
  const [searchParams, setSearchParams] = useSearchParams()
  const { filters, allergenName, page, pageSize } = parseFilterParams(searchParams)

  const { panel, displayPanel, setPanel, closePanel } = usePanelState<PanelState>()
  const [peakHoursOpen, setPeakHoursOpen] = useState(false)
  const [recordId, setRecordId] = useState<string | null>(null)
  const closeRecord = useCallback(() => setRecordId(null), [])

  const { allergen, isPending: isAllergenPending } = useAllergenByName(allergenName)
  const activeFilters: PatientFiltersType = { ...filters, allergen }

  const patientsQuery = usePatientsQuery(activeFilters, page, pageSize, !isAllergenPending)

  const writeParams = useCallback(
    (nextFilters: PatientFiltersType, nextPage: number, nextPageSize: number) => {
      setSearchParams(toFilterParams(nextFilters, nextPage, nextPageSize), { replace: true })
    },
    [setSearchParams],
  )

  const afterWrite = (title: string) => {
    closePanel()
    showToast({ tone: 'success', title })
  }

  return (
    <div className={layout.page}>
      <PageHeader
        title="Patient Records"
        subtitle="Overview and entry of animals, owners, and basic medical information."
        mobileActions="floating"
        actions={
          isVeterinarian && (
            <Button
              variant="primary"
              type="button"
              shortcut="n"
              onClick={() => setPanel({ mode: 'create' })}
            >
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
        onRowClick={(patient) => setRecordId(patient.id)}
        emptyMessage={
          isVeterinarian
            ? undefined
            : 'Your animals will appear here after their first visit to the clinic.'
        }
      />

      <PatientRecord patientId={recordId} onClose={closeRecord} />

      {isVeterinarian && displayPanel.mode === 'create' && (
        <PatientFormPanel
          mode="create"
          open={panel.mode === 'create'}
          onOpenChange={(open) => !open && closePanel()}
          onSaved={(patientName) => afterWrite(`${patientName} was created`)}
          onMissing={() => afterWrite('That patient no longer exists')}
        />
      )}

      {isVeterinarian && <PeakHoursPanel open={peakHoursOpen} onOpenChange={setPeakHoursOpen} />}
    </div>
  )
}
