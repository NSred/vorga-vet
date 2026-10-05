import type { ChargeLine, ChargeLineDto } from '../types'
import { getCharges, saveCharges } from './mockChargesStore'

const MOCK_DELAY_MS = import.meta.env.MODE === 'test' ? 0 : 150

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
}

function toChargeLine(dto: ChargeLineDto): ChargeLine {
  const line: ChargeLine = {
    id: dto.id,
    kind: dto.kind,
    name: dto.name,
    unitPrice: dto.unitPrice,
    quantity: dto.quantity,
  }
  if (dto.itemId) line.itemId = dto.itemId
  if (dto.dose) line.dose = dto.dose
  if (dto.vaccine) {
    line.vaccine = { isRabies: dto.vaccine.isRabies, dueOn: dto.vaccine.dueOn }
    if (dto.vaccine.batch) line.vaccine.batch = dto.vaccine.batch
  }
  return line
}

export async function getExaminationCharges(examinationId: string): Promise<ChargeLine[]> {
  await settle()
  return getCharges(examinationId).lines.map(toChargeLine)
}

export async function saveExaminationCharges(
  examinationId: string,
  lines: ChargeLine[],
): Promise<void> {
  await settle()
  saveCharges(
    examinationId,
    lines.map((line) => ({
      id: line.id,
      kind: line.kind,
      itemId: line.itemId ?? null,
      name: line.name,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      dose: line.dose ?? null,
      vaccine: line.vaccine
        ? {
            isRabies: line.vaccine.isRabies,
            batch: line.vaccine.batch ?? null,
            dueOn: line.vaccine.dueOn,
          }
        : null,
    })),
  )
}
