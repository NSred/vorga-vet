import { formatDateOnly } from '@/shared/lib/dateOnly'
import type { Appointment } from '../types'

function daysFromToday(offset: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return formatDateOnly(date)
}

export const appointments: Appointment[] = [
  { id: 'a1', patientId: 'p1', date: daysFromToday(-3), time: '09:00', type: 'checkup', reminderEnabled: false, attachments: [] },
  { id: 'a2', patientId: 'p2', date: daysFromToday(-1), time: '10:00', type: 'vaccination', reminderEnabled: true, attachments: [] },
  { id: 'a3', patientId: 'p3', date: daysFromToday(0), time: '08:00', type: 'first_visit', reminderEnabled: false, attachments: [] },
  { id: 'a4', patientId: 'p4', date: daysFromToday(0), time: '08:00', type: 'checkup', reminderEnabled: true, attachments: [] },
  { id: 'a5', patientId: 'p5', date: daysFromToday(0), time: '11:00', type: 'other', reminderEnabled: false, note: 'Routine checkup', attachments: [] },
  { id: 'a6', patientId: 'p6', date: daysFromToday(0), time: '14:00', type: 'checkup', reminderEnabled: false, attachments: [] },
  { id: 'a7', patientId: 'p7', date: daysFromToday(0), time: '16:00', type: 'vaccination', reminderEnabled: true, attachments: [] },
  { id: 'a8', patientId: 'p1', date: daysFromToday(1), time: '09:00', type: 'checkup', reminderEnabled: false, attachments: [] },
  { id: 'a9', patientId: 'p2', date: daysFromToday(2), time: '13:00', type: 'first_visit', reminderEnabled: true, attachments: [] },
  { id: 'a10', patientId: 'p3', date: daysFromToday(3), time: '10:00', type: 'other', reminderEnabled: false, attachments: [] },
  { id: 'a11', patientId: 'p5', date: daysFromToday(5), time: '15:00', type: 'checkup', reminderEnabled: false, attachments: [] },
  { id: 'a12', patientId: 'p6', date: daysFromToday(-5), time: '09:00', type: 'vaccination', reminderEnabled: false, attachments: [] },
]
