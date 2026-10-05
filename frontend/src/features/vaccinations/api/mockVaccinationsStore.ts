import { ApiError } from '@/shared/lib/apiClient'
import { clinicToday } from '@/shared/lib/clinicTime'
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

const STORE_VERSION = 1
const MAX_NAME_LENGTH = 200
const MAX_BATCH_LENGTH = 50
const MAX_REASON_LENGTH = 200
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

interface StoreState {
  version: number
  vaccinations: VaccinationDto[]
  reminders: ReminderDto[]
}

let state: StoreState | null = null

function isStoreState(value: unknown): value is StoreState {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<StoreState>
  return (
    candidate.version === STORE_VERSION &&
    Array.isArray(candidate.vaccinations) &&
    Array.isArray(candidate.reminders)
  )
}

function readStorage(): StoreState | null {
  try {
    const raw = window.localStorage.getItem(VACCINATIONS_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isStoreState(parsed) ? parsed : null
  } catch {
    return null
  }
}

function load(): StoreState {
  state ??= readStorage() ?? { version: STORE_VERSION, vaccinations: [], reminders: [] }
  return state
}

function commit(): void {
  if (!state) return
  try {
    window.localStorage.setItem(VACCINATIONS_STORAGE_KEY, JSON.stringify(state))
  } catch {
    return
  }
}

export function resetVaccinationsStore(): void {
  state = null
  try {
    window.localStorage.removeItem(VACCINATIONS_STORAGE_KEY)
  } catch {
    return
  }
}

function newId(prefix: string): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function isDate(value: string | undefined): value is string {
  return typeof value === 'string' && DATE_PATTERN.test(value)
}

function fail(messages: string[]): never {
  throw new ApiError(
    400,
    'One or more validation errors occurred.',
    vaccinationErrors.validation,
    messages,
  )
}

function trimmedOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function vaccineMessages(
  name: string,
  batch: string | null | undefined,
  givenOn: string,
  dueOn: string,
  at = '',
): string[] {
  const messages: string[] = []
  const trimmed = name?.trim() ?? ''
  if (!trimmed) messages.push(`${at}Vaccine is required.`)
  else if (trimmed.length > MAX_NAME_LENGTH) messages.push(`${at}Vaccine name is too long.`)
  if ((batch?.trim().length ?? 0) > MAX_BATCH_LENGTH) {
    messages.push(`${at}Batch must be at most ${MAX_BATCH_LENGTH} characters.`)
  }
  if (!isDate(givenOn)) messages.push(`${at}Given on must be a date.`)
  else if (givenOn > clinicToday()) messages.push(`${at}Given on cannot be in the future.`)
  if (!isDate(dueOn)) messages.push(`${at}Due on must be a date.`)
  else if (isDate(givenOn) && dueOn <= givenOn) messages.push(`${at}Due on must be after given on.`)
  return messages
}

function sameVaccine(a: VaccinationDto, b: VaccinationDto): boolean {
  if (a.itemId && b.itemId) return a.itemId === b.itemId
  return a.vaccineName.trim().toLocaleLowerCase() === b.vaccineName.trim().toLocaleLowerCase()
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

export function findVaccination(id: string): VaccinationDto | undefined {
  const vaccination = load().vaccinations.find((candidate) => candidate.id === id)
  return vaccination ? { ...vaccination } : undefined
}

export function listPatientVaccinations(patientId: string): VaccinationDto[] {
  return load()
    .vaccinations.filter((vaccination) => vaccination.patientId === patientId)
    .sort((a, b) => b.givenOn.localeCompare(a.givenOn) || b.createdAt.localeCompare(a.createdAt))
    .map((vaccination) => ({ ...vaccination }))
}

export function addManualVaccination(patientId: string, request: ManualVaccinationRequest): string {
  const messages = vaccineMessages(
    request.vaccineName,
    request.batch,
    request.givenOn,
    request.dueOn,
  )
  if (messages.length > 0) fail(messages)

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
  load().vaccinations.push(vaccination)
  commit()
  return vaccination.id
}

export function removeVaccination(id: string): void {
  const current = load()
  const vaccination = current.vaccinations.find((candidate) => candidate.id === id)
  if (!vaccination)
    throw new ApiError(404, 'The vaccination was not found.', vaccinationErrors.notFound)
  if (vaccination.source !== 'manual') {
    throw new ApiError(409, 'Edit the exam to change this vaccination.', vaccinationErrors.fromExam)
  }
  current.vaccinations = current.vaccinations.filter((candidate) => candidate.id !== id)
  commit()
}

export function replaceExamVaccinations(
  examinationId: string,
  request: ExamVaccinationsRequest,
): void {
  const messages = request.lines.flatMap((line, index) =>
    vaccineMessages(
      line.vaccineName,
      line.batch,
      request.givenOn,
      line.dueOn,
      `Line ${index + 1}: `,
    ),
  )
  if (messages.length > 0) fail(messages)

  const current = load()
  const createdAt = new Date().toISOString()
  current.vaccinations = [
    ...current.vaccinations.filter((vaccination) => vaccination.examinationId !== examinationId),
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
  commit()
}

export function markContacted(id: string): void {
  const vaccination = load().vaccinations.find((candidate) => candidate.id === id)
  if (!vaccination)
    throw new ApiError(404, 'The vaccination was not found.', vaccinationErrors.notFound)
  if (vaccination.contactedAt) return
  vaccination.contactedAt = new Date().toISOString()
  commit()
}

export function listPatientReminders(patientId: string): ReminderDto[] {
  return load()
    .reminders.filter((reminder) => reminder.patientId === patientId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((reminder) => ({ ...reminder }))
}

export function addReminder(patientId: string, request: ReminderRequest): string {
  const messages: string[] = []
  const reason = request.reason?.trim() ?? ''
  if (!reason) messages.push('Reason is required.')
  else if (reason.length > MAX_REASON_LENGTH) messages.push('Reason is too long.')
  if (!isDate(request.date)) messages.push('Date must be a date.')
  else if (request.date < clinicToday()) messages.push('Date cannot be in the past.')
  if (messages.length > 0) fail(messages)

  const reminder: ReminderDto = {
    id: newId('reminder'),
    patientId,
    date: request.date,
    reason,
    doneAt: null,
    createdAt: new Date().toISOString(),
  }
  load().reminders.push(reminder)
  commit()
  return reminder.id
}

export function completeReminder(id: string): void {
  const reminder = load().reminders.find((candidate) => candidate.id === id)
  if (!reminder)
    throw new ApiError(404, 'The reminder was not found.', vaccinationErrors.reminderNotFound)
  if (reminder.doneAt) return
  reminder.doneAt = new Date().toISOString()
  commit()
}

export function listDue(until: string): DueItemDto[] {
  const { vaccinations, reminders } = load()

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
