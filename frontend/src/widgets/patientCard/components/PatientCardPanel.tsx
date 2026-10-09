import { useState } from 'react'
import { SPECIES_TINT } from '@/shared/domain/species'
import { CenteredPanel } from '@/shared/ui'
import { useAuth, useCurrentUser } from '@/features/auth'
import type { Examination } from '@/features/examinations'
import { VisitDetailPanel, VisitHistory, VisitsSummary } from '@/features/examinations'
import { MicrochipSection } from '@/features/microchips'
import { PatientDetailPanel, PatientHeader, type PatientDetail } from '@/features/patients'
import { ChargesSummary } from '@/features/priceList'
import {
  RemindersSection,
  useLatestRabiesVaccination,
  VaccinationsSection,
} from '@/features/vaccinations'
import { certificateSubjectOf } from '../lib/certificateSubject'

export interface PatientCardPanelProps {
  patient: PatientDetail
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: () => void
  onDelete: () => void
  onEditVisit: (examination: Examination) => void
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

export function PatientCardPanel({
  patient,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onEditVisit,
}: PatientCardPanelProps) {
  const { user } = useAuth()
  const profile = useCurrentUser()
  const [historyFor, setHistoryFor] = useState<string | null>(null)
  const [viewing, setViewing] = useState<{ patientId: string; visitId: string } | null>(null)

  if (user?.role !== 'veterinarian') {
    return <PatientDetailPanel patient={patient} open={open} onOpenChange={onOpenChange} />
  }

  const vetName = profile.data ? `${profile.data.firstName} ${profile.data.lastName}`.trim() : ''
  const historyOpen = open && historyFor === patient.id

  return (
    <>
      <PatientDetailPanel
        patient={patient}
        open={open}
        onOpenChange={onOpenChange}
        onEdit={onEdit}
        onDelete={onDelete}
        vaccinationsSection={
          <VaccinationsSection
            patientId={patient.id}
            certificateSubject={certificateSubjectOf(patient)}
            vetName={vetName}
          />
        }
        microchipSection={<PatientMicrochip patient={patient} vetName={vetName} />}
        remindersSection={<RemindersSection patientId={patient.id} />}
        visitsSection={
          <VisitsSummary patientId={patient.id} onOpen={() => setHistoryFor(patient.id)} />
        }
      />

      <CenteredPanel
        open={historyOpen}
        onOpenChange={(next) => !next && setHistoryFor(null)}
        size="wide"
        ariaLabel={`Visit history for ${patient.name}`}
        headerTone="accent"
        headerTint={SPECIES_TINT[patient.species]}
        header={
          <PatientHeader patient={patient} eyebrow={`Visit history · ${patient.cardNumber}`} />
        }
      >
        <VisitHistory
          patientId={patient.id}
          onOpen={(visit) => setViewing({ patientId: patient.id, visitId: visit.id })}
        />
      </CenteredPanel>

      <VisitDetailPanel
        patientId={patient.id}
        visitId={historyOpen && viewing?.patientId === patient.id ? viewing.visitId : null}
        onClose={() => setViewing(null)}
        onEdit={(visit) => {
          setViewing(null)
          onEditVisit(visit)
        }}
        renderCharges={(visit) => <ChargesSummary examinationId={visit.id} />}
      />
    </>
  )
}
