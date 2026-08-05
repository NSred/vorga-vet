import { simulateLatency } from '@/shared/lib/simulateLatency'
import { appointments } from './mockData'
import type { Appointment, AppointmentAttachment, AppointmentInput } from '../types'

export function getAppointments(): Promise<Appointment[]> {
  return simulateLatency([...appointments])
}

export async function getAppointment(id: string): Promise<Appointment> {
  const appointment = appointments.find((item) => item.id === id)
  if (!appointment) {
    throw new Error(`Appointment ${id} not found`)
  }
  return simulateLatency(appointment)
}

export async function createAppointment(input: AppointmentInput): Promise<Appointment> {
  const appointment: Appointment = {
    ...input,
    id: crypto.randomUUID(),
    attachments: [],
  }
  appointments.push(appointment)
  return simulateLatency(appointment)
}

export async function updateAppointment(id: string, input: AppointmentInput): Promise<Appointment> {
  const index = appointments.findIndex((item) => item.id === id)
  if (index === -1) {
    throw new Error(`Appointment ${id} not found`)
  }
  const updated: Appointment = { ...appointments[index], ...input, id, attachments: appointments[index].attachments }
  appointments[index] = updated
  return simulateLatency(updated)
}

export async function deleteAppointment(id: string): Promise<void> {
  const index = appointments.findIndex((item) => item.id === id)
  if (index === -1) {
    throw new Error(`Appointment ${id} not found`)
  }
  appointments.splice(index, 1)
  await simulateLatency(undefined)
}

export async function addAttachment(appointmentId: string, file: File): Promise<Appointment> {
  const index = appointments.findIndex((item) => item.id === appointmentId)
  if (index === -1) {
    throw new Error(`Appointment ${appointmentId} not found`)
  }
  const attachment: AppointmentAttachment = {
    id: crypto.randomUUID(),
    fileName: file.name,
    fileType: file.type,
    fileSizeBytes: file.size,
    previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
  }
  const updated: Appointment = {
    ...appointments[index],
    attachments: [...appointments[index].attachments, attachment],
  }
  appointments[index] = updated
  return simulateLatency(updated)
}

export async function removeAttachment(appointmentId: string, attachmentId: string): Promise<Appointment> {
  const index = appointments.findIndex((item) => item.id === appointmentId)
  if (index === -1) {
    throw new Error(`Appointment ${appointmentId} not found`)
  }
  const updated: Appointment = {
    ...appointments[index],
    attachments: appointments[index].attachments.filter((item) => item.id !== attachmentId),
  }
  appointments[index] = updated
  return simulateLatency(updated)
}
