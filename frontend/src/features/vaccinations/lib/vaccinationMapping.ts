import type {
  DueItem,
  DueItemDto,
  Reminder,
  ReminderDto,
  Vaccination,
  VaccinationDto,
} from '../types'

export function toVaccination(dto: VaccinationDto): Vaccination {
  const vaccination: Vaccination = {
    id: dto.id,
    patientId: dto.patientId,
    vaccineName: dto.vaccineName,
    isRabies: dto.isRabies,
    givenOn: dto.givenOn,
    dueOn: dto.dueOn,
    source: dto.source,
  }
  if (dto.examinationId) vaccination.examinationId = dto.examinationId
  if (dto.itemId) vaccination.itemId = dto.itemId
  if (dto.batch) vaccination.batch = dto.batch
  if (dto.contactedAt) vaccination.contactedAt = dto.contactedAt
  return vaccination
}

export function toReminder(dto: ReminderDto): Reminder {
  const reminder: Reminder = {
    id: dto.id,
    patientId: dto.patientId,
    date: dto.date,
    reason: dto.reason,
  }
  if (dto.doneAt) reminder.doneAt = dto.doneAt
  return reminder
}

export function toDueItem(dto: DueItemDto): DueItem {
  const item: DueItem = {
    kind: dto.kind,
    id: dto.id,
    patientId: dto.patientId,
    title: dto.title,
    dueOn: dto.dueOn,
  }
  if (dto.contactedAt) item.contactedAt = dto.contactedAt
  return item
}

export function nextDue(vaccinations: Vaccination[]): Vaccination | undefined {
  const latestPerVaccine = new Map<string, Vaccination>()
  for (const vaccination of vaccinations) {
    const key = vaccination.itemId ?? vaccination.vaccineName.trim().toLocaleLowerCase()
    const current = latestPerVaccine.get(key)
    if (!current || vaccination.givenOn > current.givenOn) latestPerVaccine.set(key, vaccination)
  }
  return [...latestPerVaccine.values()].sort((a, b) => a.dueOn.localeCompare(b.dueOn))[0]
}
