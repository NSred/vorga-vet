import { ApiError } from '@/shared/lib/apiClient'
import { clinicToday } from '@/shared/lib/clinicTime'
import { assertValid } from '@/shared/lib/mockApi'
import { createMockStore, newId } from '@/shared/lib/mockStore'
import { isDateOnly, sameText, trimmedLength, trimmedOrNull } from '@/shared/lib/validation'
import type {
  DueItemDto,
  ExamVaccinationsRequest,
  ManualVaccinationRequest,
  ReminderDto,
  ReminderRequest,
  VaccinationDto,
} from '../types'
import { vaccinationErrors } from './vaccinationErrors'

export const VACCINATIONS_STORAGE_KEY = 'vorgavet.mock.vaccinations'

const MAX_NAME_LENGTH = 200
const MAX_BATCH_LENGTH = 50
const MAX_REASON_LENGTH = 200

const store = createMockStore<{ vaccinations: VaccinationDto[]; reminders: ReminderDto[] }>({
  key: VACCINATIONS_STORAGE_KEY,
  version: 1,
  isValid: (value) => Array.isArray(value.vaccinations) && Array.isArray(value.reminders),
  initial: () => ({ vaccinations: [], reminders: [] }),
})

export const resetVaccinationsStore = store.reset

function vaccineMessages(
  name: string,
  batch: string | null | undefined,
  givenOn: string,
  dueOn: string,
  at = '',
): string[] {
  const messages: string[] = []
  const nameLength = trimmedLength(name)
  if (nameLength === 0) messages.push(`${at}Vaccine is required.`)
  else if (nameLength > MAX_NAME_LENGTH) messages.push(`${at}Vaccine name is too long.`)
  if (trimmedLength(batch) > MAX_BATCH_LENGTH) {
    messages.push(`${at}Batch must be at most ${MAX_BATCH_LENGTH} characters.`)
  }
  if (!isDateOnly(givenOn)) messages.push(`${at}Given on must be a date.`)
  else if (givenOn > clinicToday()) messages.push(`${at}Given on cannot be in the future.`)
  if (!isDateOnly(dueOn)) messages.push(`${at}Due on must be a date.`)
  else if (isDateOnly(givenOn) && dueOn <= givenOn)
    messages.push(`${at}Due on must be after given on.`)
  return messages
}

function sameVaccine(a: VaccinationDto, b: VaccinationDto): boolean {
  if (a.itemId && b.itemId) return a.itemId === b.itemId
  return sameText(a.vaccineName, b.vaccineName)
}

function isReplaced(vaccination: VaccinationDto, all: VaccinationDto[]): boolean {
  return all.some(
    (other) =>
      other.id !== vaccination.id &&
      other.patientId === vaccination.patientId &&
      sameVaccine(other, vaccination) &&
      (other.givenOn > vaccination.givenOn ||
        (other.givenOn === vaccination.givenOn && other.createdAt > vaccination.createdAt)),
  )
}

function storedVaccination(id: string): VaccinationDto {
  const vaccination = store.state().vaccinations.find((candidate) => candidate.id === id)
  if (!vaccination)
    throw new ApiError(404, 'The vaccination was not found.', vaccinationErrors.notFound)
  return vaccination
}

export function findVaccination(id: string): VaccinationDto | undefined {
  const vaccination = store.state().vaccinations.find((candidate) => candidate.id === id)
  return vaccination ? { ...vaccination } : undefined
}

export function listPatientVaccinations(patientId: string): VaccinationDto[] {
  return store
    .state()
    .vaccinations.filter((vaccination) => vaccination.patientId === patientId)
    .sort((a, b) => b.givenOn.localeCompare(a.givenOn) || b.createdAt.localeCompare(a.createdAt))
    .map((vaccination) => ({ ...vaccination }))
}

export function addManualVaccination(patientId: string, request: ManualVaccinationRequest): string {
  assertValid(vaccineMessages(request.vaccineName, request.batch, request.givenOn, request.dueOn))

  const vaccination: VaccinationDto = {
    id: newId('vaccination'),
    patientId,
    examinationId: null,
    itemId: request.itemId ?? null,
    vaccineName: request.vaccineName.trim(),
    isRabies: Boolean(request.isRabies),
    batch: trimmedOrNull(request.batch),
    givenOn: request.givenOn,
    dueOn: request.dueOn,
    source: 'manual',
    contactedAt: null,
    createdAt: new Date().toISOString(),
  }
  store.state().vaccinations.push(vaccination)
  store.commit()
  return vaccination.id
}

export function removeVaccination(id: string): void {
  const vaccination = storedVaccination(id)
  if (vaccination.source !== 'manual') {
    throw new ApiError(409, 'Edit the exam to change this vaccination.', vaccinationErrors.fromExam)
  }
  const state = store.state()
  state.vaccinations = state.vaccinations.filter((candidate) => candidate.id !== id)
  store.commit()
}

export function replaceExamVaccinations(
  examinationId: string,
  request: ExamVaccinationsRequest,
): void {
  assertValid(
    request.lines.flatMap((line, index) =>
      vaccineMessages(
        line.vaccineName,
        line.batch,
        request.givenOn,
        line.dueOn,
        `Line ${index + 1}: `,
      ),
    ),
  )

  const state = store.state()
  const createdAt = new Date().toISOString()
  state.vaccinations = [
    ...state.vaccinations.filter((vaccination) => vaccination.examinationId !== examinationId),
    ...request.lines.map((line): VaccinationDto => ({
      id: newId('vaccination'),
      patientId: request.patientId,
      examinationId,
      itemId: line.itemId,
      vaccineName: line.vaccineName.trim(),
      isRabies: Boolean(line.isRabies),
      batch: trimmedOrNull(line.batch),
      givenOn: request.givenOn,
      dueOn: line.dueOn,
      source: 'exam',
      contactedAt: null,
      createdAt,
    })),
  ]
  store.commit()
}

export function markContacted(id: string): void {
  const vaccination = storedVaccination(id)
  if (vaccination.contactedAt) return
  vaccination.contactedAt = new Date().toISOString()
  store.commit()
}

export function listPatientReminders(patientId: string): ReminderDto[] {
  return store
    .state()
    .reminders.filter((reminder) => reminder.patientId === patientId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((reminder) => ({ ...reminder }))
}

export function addReminder(patientId: string, request: ReminderRequest): string {
  const messages: string[] = []
  const reason = request.reason?.trim() ?? ''
  if (!reason) messages.push('Reason is required.')
  else if (reason.length > MAX_REASON_LENGTH) messages.push('Reason is too long.')
  if (!isDateOnly(request.date)) messages.push('Date must be a date.')
  else if (request.date < clinicToday()) messages.push('Date cannot be in the past.')
  assertValid(messages)

  const reminder: ReminderDto = {
    id: newId('reminder'),
    patientId,
    date: request.date,
    reason,
    doneAt: null,
    createdAt: new Date().toISOString(),
  }
  store.state().reminders.push(reminder)
  store.commit()
  return reminder.id
}

export function completeReminder(id: string): void {
  const reminder = store.state().reminders.find((candidate) => candidate.id === id)
  if (!reminder)
    throw new ApiError(404, 'The reminder was not found.', vaccinationErrors.reminderNotFound)
  if (reminder.doneAt) return
  reminder.doneAt = new Date().toISOString()
  store.commit()
}

export function listDue(until: string): DueItemDto[] {
  const { vaccinations, reminders } = store.state()

  const dueVaccinations = vaccinations
    .filter((vaccination) => vaccination.dueOn <= until && !isReplaced(vaccination, vaccinations))
    .map((vaccination): DueItemDto => ({
      kind: 'vaccination',
      id: vaccination.id,
      patientId: vaccination.patientId,
      title: vaccination.vaccineName,
      dueOn: vaccination.dueOn,
      contactedAt: vaccination.contactedAt,
      doneAt: null,
    }))

  const openReminders = reminders
    .filter((reminder) => !reminder.doneAt && reminder.date <= until)
    .map((reminder): DueItemDto => ({
      kind: 'reminder',
      id: reminder.id,
      patientId: reminder.patientId,
      title: reminder.reason,
      dueOn: reminder.date,
      contactedAt: null,
      doneAt: null,
    }))

  return [...dueVaccinations, ...openReminders].sort(
    (a, b) => a.dueOn.localeCompare(b.dueOn) || a.title.localeCompare(b.title, 'sr'),
  )
}
