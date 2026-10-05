import { toDueItem, toReminder, toVaccination } from '../lib/vaccinationMapping'
import type {
  DueItem,
  ExamVaccinationsRequest,
  ManualVaccinationRequest,
  Reminder,
  ReminderRequest,
  Vaccination,
} from '../types'
import {
  addManualVaccination,
  addReminder,
  completeReminder,
  listDue,
  listPatientReminders,
  listPatientVaccinations,
  markContacted,
  removeVaccination,
  replaceExamVaccinations,
} from './mockVaccinationsStore'

const MOCK_DELAY_MS = import.meta.env.MODE === 'test' ? 0 : 150

function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
}

export async function getPatientVaccinations(patientId: string): Promise<Vaccination[]> {
  await settle()
  return listPatientVaccinations(patientId).map(toVaccination)
}

export async function createManualVaccination(
  patientId: string,
  request: ManualVaccinationRequest,
): Promise<string> {
  await settle()
  return addManualVaccination(patientId, request)
}

export async function deleteVaccination(id: string): Promise<void> {
  await settle()
  removeVaccination(id)
}

export async function saveExamVaccinations(
  examinationId: string,
  request: ExamVaccinationsRequest,
): Promise<void> {
  await settle()
  replaceExamVaccinations(examinationId, request)
}

export async function markVaccinationContacted(id: string): Promise<void> {
  await settle()
  markContacted(id)
}

export async function getPatientReminders(patientId: string): Promise<Reminder[]> {
  await settle()
  return listPatientReminders(patientId).map(toReminder)
}

export async function createReminder(patientId: string, request: ReminderRequest): Promise<string> {
  await settle()
  return addReminder(patientId, request)
}

export async function markReminderDone(id: string): Promise<void> {
  await settle()
  completeReminder(id)
}

export async function getDueItems(until: string): Promise<DueItem[]> {
  await settle()
  return listDue(until).map(toDueItem)
}
