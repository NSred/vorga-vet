import { clinicDateOf, clinicTimeOf } from '@/shared/lib/clinicTime'
import type { Appointment, AvailabilitySlot } from '../types'

const ROW_MINUTES = 30
const FALLBACK_FIRST = 7 * 60
const FALLBACK_LAST = 19 * 60 + 30

export interface WeekRow {
  minutes: number
  label: string
  isBusy: boolean
}

export interface WeekBlock {
  appointment: Appointment
  row: number
  span: number
  lane: number
}

export interface WeekDay {
  date: string
  blocks: WeekBlock[]
  laneCount: number
  openRows: Set<number>
  isClosed: boolean
}

export interface WeekLayout {
  rows: WeekRow[]
  days: WeekDay[]
}

function minutesOf(utcIso: string): number {
  const [hours, minutes] = clinicTimeOf(utcIso).split(':').map(Number)
  return hours * 60 + minutes
}

function rowStart(minutes: number): number {
  return Math.floor(minutes / ROW_MINUTES) * ROW_MINUTES
}

function timeLabel(minutes: number): string {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0')
  return `${hours}:${String(minutes % 60).padStart(2, '0')}`
}

function rowMinutes(dates: Set<string>, appointments: Appointment[], slots: AvailabilitySlot[]) {
  const used: number[] = []
  for (const slot of slots) {
    if (dates.has(clinicDateOf(slot.startsAt))) used.push(rowStart(minutesOf(slot.startsAt)))
  }
  for (const appointment of appointments) {
    const start = minutesOf(appointment.startsAt)
    used.push(rowStart(start), rowStart(start + appointment.durationMinutes - 1))
  }

  const first = used.length > 0 ? Math.min(...used) : FALLBACK_FIRST
  const last = used.length > 0 ? Math.max(...used) : FALLBACK_LAST
  const minutes: number[] = []
  for (let value = first; value <= last; value += ROW_MINUTES) minutes.push(value)
  return minutes
}

function layoutColumn(appointments: Appointment[], minutes: number[]) {
  const placed = appointments
    .map((appointment) => {
      const start = minutesOf(appointment.startsAt)
      const row = minutes.indexOf(rowStart(start))
      const end = start + appointment.durationMinutes
      let span = 1
      while (row + span < minutes.length && minutes[row + span] < end) span += 1
      return { appointment, row, span }
    })
    .filter((block) => block.row >= 0)
    .sort((a, b) => a.row - b.row || a.appointment.startsAt.localeCompare(b.appointment.startsAt))

  const laneEnds: number[] = []
  const blocks = placed.map((block) => {
    let lane = laneEnds.findIndex((end) => end <= block.row)
    if (lane < 0) lane = laneEnds.length
    laneEnds[lane] = block.row + block.span
    return { ...block, lane }
  })

  return { blocks, laneCount: Math.max(1, laneEnds.length) }
}

export function layoutWeek(
  dates: string[],
  appointments: Appointment[],
  slots: AvailabilitySlot[],
  hasSlotData: boolean,
): WeekLayout {
  const dateSet = new Set(dates)
  const inWeek = appointments.filter((appointment) =>
    dateSet.has(clinicDateOf(appointment.startsAt)),
  )
  const minutes = rowMinutes(dateSet, inWeek, slots)

  const days = dates.map((date) => {
    const daySlots = slots.filter((slot) => clinicDateOf(slot.startsAt) === date)
    const dayAppointments = inWeek.filter(
      (appointment) => clinicDateOf(appointment.startsAt) === date,
    )
    const openRows = new Set(
      daySlots.map((slot) => minutes.indexOf(rowStart(minutesOf(slot.startsAt)))),
    )
    return {
      date,
      ...layoutColumn(dayAppointments, minutes),
      openRows,
      isClosed: hasSlotData && daySlots.length === 0,
    }
  })

  const busy = new Set<number>()
  for (const day of days) {
    for (const block of day.blocks) {
      for (let row = block.row; row < block.row + block.span; row += 1) busy.add(row)
    }
  }

  return {
    rows: minutes.map((value, index) => ({
      minutes: value,
      label: timeLabel(value),
      isBusy: busy.has(index),
    })),
    days,
  }
}
