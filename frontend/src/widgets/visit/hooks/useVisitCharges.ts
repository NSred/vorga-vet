import { clinicDateOf, clinicToday } from '@/shared/lib/clinicTime'
import type { CostSlot, Examination, ExaminationRef } from '@/features/examinations'
import { useExaminationCharges, type ChargeLine } from '@/features/priceList'
import { useSaveExamVaccinations, type ExamVaccinationLine } from '@/features/vaccinations'

export interface VisitChargesOptions {
  open: boolean
  examination?: Examination
}

function vaccinationLinesOf(lines: ChargeLine[]): ExamVaccinationLine[] {
  return lines.flatMap((line) =>
    line.kind === 'medication' && line.vaccine && line.itemId
      ? [
          {
            itemId: line.itemId,
            vaccineName: line.name,
            isRabies: line.vaccine.isRabies,
            batch: line.vaccine.batch ?? null,
            dueOn: line.vaccine.dueOn,
          },
        ]
      : [],
  )
}

export function useVisitCharges({ open, examination }: VisitChargesOptions): CostSlot {
  const charges = useExaminationCharges({
    open,
    examinationId: examination?.id,
    earlierCost: examination?.cost,
    givenOn: examination ? clinicDateOf(examination.startedAt) : clinicToday(),
  })
  const saveVaccinations = useSaveExamVaccinations()

  return {
    section: charges.section,
    total: charges.total,
    validate: charges.validate,
    commit: async (saved: ExaminationRef) => {
      const lines = await charges.commit(saved.id)
      await saveVaccinations.mutateAsync({
        examinationId: saved.id,
        request: {
          patientId: saved.patientId,
          givenOn: clinicDateOf(saved.startedAt),
          lines: vaccinationLinesOf(lines),
        },
      })
    },
  }
}
