import { useAuth, useCurrentUser } from '@/features/auth'
import type { Examination } from '@/features/examinations'
import { VisitHistory } from '@/features/examinations'
import { MicrochipSection } from '@/features/microchips'
import { PatientDetailPanel, type PatientDetail } from '@/features/patients'
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

  if (user?.role !== 'veterinarian') {
    return <PatientDetailPanel patient={patient} open={open} onOpenChange={onOpenChange} />
  }

  const vetName = profile.data ? `${profile.data.firstName} ${profile.data.lastName}`.trim() : ''

  return (
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
        <VisitHistory
          patientId={patient.id}
          onEdit={onEditVisit}
          renderCharges={(examination) => <ChargesSummary examinationId={examination.id} />}
        />
      }
    />
  )
}
