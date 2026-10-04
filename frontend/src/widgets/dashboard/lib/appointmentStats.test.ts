import { describe, expect, it } from 'vitest'
import {
  appointmentsOn,
  countByHour,
  countedAppointments,
  dayBreakdown,
  hourHistogram,
  peakOf,
} from './appointmentStats'
import type { Appointment } from '@/features/appointments'

function appointmentAt(startsAt: string, status: Appointment['status'] = 'scheduled'): Appointment {
  return {
    id: startsAt,
    createdByUserId: 'u1',
    startsAt,
    endsAt: startsAt,
    durationMinutes: 30,
    type: 'checkup',
    status,
    createdAt: '2026-09-01T00:00:00Z',
  }
}

const appointments = [
  appointmentAt('2026-09-17T07:00:00Z'),
  appointmentAt('2026-09-17T07:30:00Z'),
  appointmentAt('2026-09-17T12:00:00Z'),
  appointmentAt('2026-09-16T23:30:00Z'),
]

describe('appointmentsOn', () => {
  it('groups by the clinic day, not the UTC day', () => {
    expect(appointmentsOn(appointments, '2026-09-17')).toHaveLength(4)
  })
})

describe('countByHour and peakOf', () => {
  it('buckets by the clinic hour of the start time', () => {
    const counts = countByHour(appointments)

    expect(counts.get('09:00')).toBe(2)
    expect(counts.get('14:00')).toBe(1)
    expect(counts.get('01:00')).toBe(1)
    expect(peakOf(counts)).toEqual({ hour: '09:00', count: 2 })
  })
})

describe('countedAppointments', () => {
  it('drops cancelled and no-show', () => {
    const mixed = [
      appointmentAt('2026-09-17T07:00:00Z'),
      appointmentAt('2026-09-17T07:30:00Z', 'cancelled'),
      appointmentAt('2026-09-17T08:00:00Z', 'no_show'),
    ]

    expect(countedAppointments(mixed)).toHaveLength(1)
  })
})

describe('hourHistogram', () => {
  it('covers opening hours plus any hour that has appointments', () => {
    const histogram = hourHistogram(appointments)
    const hours = histogram.map((entry) => entry.hour)

    expect(histogram.find((entry) => entry.hour === '07:00')?.count).toBe(0)
    expect(histogram.find((entry) => entry.hour === '09:00')?.count).toBe(2)
    expect(histogram.find((entry) => entry.hour === '01:00')?.count).toBe(1)
    expect(hours).toEqual([...hours].sort())
  })
})

describe('dayBreakdown', () => {
  it('counts by clinic weekday', () => {
    const thursday = dayBreakdown(appointments).find((entry) => entry.day === 'Thursday')

    expect(thursday?.total).toBe(4)
  })
})
