import { describe, expect, it } from 'vitest'
import type { Appointment } from '@/features/appointments'
import {
  appointmentsOn,
  countByHour,
  dayBreakdown,
  hourBucket,
  hourHistogram,
  peakOf,
  PEAK_HOURS_RANGE,
} from './appointmentStats'

function makeAppointment(date: string, time: string, id = `${date}-${time}`): Appointment {
  return {
    id,
    patientId: 'p1',
    date,
    time,
    type: 'checkup',
    reminderEnabled: false,
    attachments: [],
  }
}

describe('hourBucket', () => {
  it('pads single-digit hours', () => {
    expect(hourBucket('9:30')).toBe('09:00')
  })

  it('drops the minutes', () => {
    expect(hourBucket('14:45')).toBe('14:00')
  })
})

describe('peakOf', () => {
  it('returns null for no appointments', () => {
    expect(peakOf(new Map())).toBeNull()
  })

  it('returns the busiest hour', () => {
    const counts = new Map([
      ['09:00', 2],
      ['11:00', 5],
    ])
    expect(peakOf(counts)).toEqual({ hour: '11:00', count: 5 })
  })

  it('keeps the first hour when counts tie', () => {
    const counts = new Map([
      ['09:00', 3],
      ['11:00', 3],
    ])
    expect(peakOf(counts)).toEqual({ hour: '09:00', count: 3 })
  })
})

describe('countByHour', () => {
  it('groups appointments into hourly buckets', () => {
    const counts = countByHour([
      makeAppointment('2026-08-29', '09:15'),
      makeAppointment('2026-08-29', '09:45'),
      makeAppointment('2026-08-29', '13:00'),
    ])

    expect(counts.get('09:00')).toBe(2)
    expect(counts.get('13:00')).toBe(1)
  })
})

describe('appointmentsOn', () => {
  it('keeps only the given date', () => {
    const result = appointmentsOn(
      [makeAppointment('2026-08-29', '09:00'), makeAppointment('2026-08-30', '09:00')],
      '2026-08-29',
    )

    expect(result).toHaveLength(1)
    expect(result[0].date).toBe('2026-08-29')
  })
})

describe('hourHistogram', () => {
  it('covers 07:00 through 20:00 inclusive', () => {
    expect(PEAK_HOURS_RANGE[0]).toBe('07:00')
    expect(PEAK_HOURS_RANGE[PEAK_HOURS_RANGE.length - 1]).toBe('20:00')
    expect(hourHistogram([])).toHaveLength(14)
  })

  it('reports zero for hours with no appointments', () => {
    const histogram = hourHistogram([makeAppointment('2026-08-29', '09:00')])

    expect(histogram.find((entry) => entry.hour === '09:00')?.count).toBe(1)
    expect(histogram.find((entry) => entry.hour === '10:00')?.count).toBe(0)
  })
})

describe('dayBreakdown', () => {
  it('orders the week Monday first and Sunday last', () => {
    const days = dayBreakdown([]).map((entry) => entry.day)

    expect(days[0]).toBe('Monday')
    expect(days[6]).toBe('Sunday')
  })

  it('totals and peaks each day independently', () => {
    const days = dayBreakdown([
      makeAppointment('2026-08-31', '09:00', 'mon-1'),
      makeAppointment('2026-08-31', '09:30', 'mon-2'),
      makeAppointment('2026-09-01', '15:00', 'tue-1'),
    ])

    const monday = days.find((entry) => entry.day === 'Monday')
    const tuesday = days.find((entry) => entry.day === 'Tuesday')

    expect(monday?.total).toBe(2)
    expect(monday?.peakHour).toEqual({ hour: '09:00', count: 2 })
    expect(tuesday?.total).toBe(1)
  })
})
