import { describe, expect, it } from 'vitest'
import { groupByClinicDate, openDates, weekDays } from './calendarDays'
import type { Appointment, AvailabilitySlot } from '../types'

function appointment(id: string, startsAt: string): Appointment {
  return {
    id,
    createdByUserId: 'u1',
    startsAt,
    endsAt: startsAt,
    durationMinutes: 30,
    type: 'checkup',
    status: 'scheduled',
    createdAt: '2026-09-10T10:00:00Z',
  }
}

describe('weekDays', () => {
  it('lists the week of a date from Monday to Sunday', () => {
    expect(weekDays('2026-10-07')).toEqual([
      '2026-10-05',
      '2026-10-06',
      '2026-10-07',
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
      '2026-10-11',
    ])
    expect(weekDays('2026-10-11')[0]).toBe('2026-10-05')
  })
})

describe('groupByClinicDate', () => {
  it('groups by clinic day and sorts by start time', () => {
    const grouped = groupByClinicDate([
      appointment('morning', '2026-09-17T05:00:00Z'),
      appointment('overnight', '2026-09-16T23:30:00Z'),
    ])

    expect(grouped.get('2026-09-17')?.map((item) => item.id)).toEqual(['overnight', 'morning'])
  })
})

describe('openDates', () => {
  it('collects the clinic dates that have slots', () => {
    const slots: AvailabilitySlot[] = [
      {
        startsAt: '2026-09-17T05:00:00Z',
        endsAt: '2026-09-17T05:30:00Z',
        isAvailable: true,
        isMine: false,
      },
    ]

    expect(openDates(slots).has('2026-09-17')).toBe(true)
    expect(openDates(slots).has('2026-09-18')).toBe(false)
  })
})
