import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { isApiErrorCode } from '@/shared/lib/apiClient'
import { usePanelState } from '@/shared/lib/usePanelState'
import { Button, ConfirmDialog, PageHeader, useToast } from '@/shared/ui'
import { useAuth, useCurrentUser } from '@/features/auth'
import { ExaminationEditPanel, VisitHistory } from '@/features/examinations'
import type { Examination } from '@/features/examinations'
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
import { DiagnosisPicker } from '@/features/diagnoses'
import { ChargesSummary } from '@/features/priceList'
import { MicrochipSection } from '@/features/microchips'
import {
  RemindersSection,
  useLatestRabiesVaccination,
  VaccinationsSection,
  type CertificateSubject,
} from '@/features/vaccinations'
import { useVisitCharges } from '@/widgets/visit'
import type {
  PatientDetail,
  PatientFiltersType,
  PatientListItem,
  PatientPage,
} from '@/features/patients'
import styles from './PatientsPage.module.css'

type PanelState =
  | { mode: 'create' }
  | { mode: 'view'; patient: PatientDetail }
  | { mode: 'edit'; patient: PatientDetail }

function certificateSubjectOf(patient: PatientDetail): CertificateSubject {
  return {
    animal: {
      name: patient.name,
      species: patient.species,
      breed: patient.breedName,
      sex: patient.sex,
      birthDate: patient.birthDate,
      color: patient.color,
      chipNumber: patient.chipNumber,
    },
    owner: {
      name: patient.ownerName,
      address: patient.address,
      city: patient.city,
      phone: patient.phoneNumber,
    },
  }
}

function PatientMicrochip({ patient, vetName }: { patient: PatientDetail; vetName: string }) {
  const latestRabies = useLatestRabiesVaccination(patient.id)

  return (
    <MicrochipSection
      patientId={patient.id}
      subject={{ chipNumber: patient.chipNumber, ...certificateSubjectOf(patient) }}
      lastRabies={
        latestRabies
          ? { vaccineName: latestRabies.vaccineName, givenOn: latestRabies.givenOn }
          : undefined
      }
      vetName={vetName}
    />
  )
}

const EMPTY_PAGE: PatientPage = { items: [], totalCount: 0, page: 1, pageSize: 10 }

export function PatientsPage() {
  const { showToast } = useToast()
  const { user } = useAuth()
  const profile = useCurrentUser()
  const vetName = profile.data ? `${profile.data.firstName} ${profile.data.lastName}`.trim() : ''
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
  }, [searchParams, setSearchParams, queryClient, setPanel])

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
      <PageHeader
        title="Patient Records"
        subtitle="Overview and entry of animals, owners, and basic medical information."
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
          vaccinationsSection={
            isVeterinarian ? (
              <VaccinationsSection
                patientId={displayPanel.patient.id}
                certificateSubject={certificateSubjectOf(displayPanel.patient)}
                vetName={vetName}
              />
            ) : undefined
          }
          microchipSection={
            isVeterinarian ? (
              <PatientMicrochip patient={displayPanel.patient} vetName={vetName} />
            ) : undefined
          }
          remindersSection={
            isVeterinarian ? <RemindersSection patientId={displayPanel.patient.id} /> : undefined
          }
          visitsSection={
            isVeterinarian ? (
              <VisitHistory
                patientId={displayPanel.patient.id}
                onEdit={setEditingVisit}
                renderCharges={(examination) => <ChargesSummary examinationId={examination.id} />}
              />
            ) : undefined
          }
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
