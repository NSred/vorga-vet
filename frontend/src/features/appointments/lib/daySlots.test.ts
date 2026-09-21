import { describe, expect, it } from 'vitest'
import { appointmentsOutsideSlots, buildDayRows } from './daySlots'
import type { Appointment, AvailabilitySlot } from '../types'

function slot(startsAt: string, endsAt: string, isAvailable = true): AvailabilitySlot {
  return { startsAt, endsAt, isAvailable, isMine: false }
}

function appointment(
  id: string,
  startsAt: string,
  endsAt: string,
  durationMinutes = 30,
): Appointment {
  return {
    id,
    createdByUserId: 'u1',
    startsAt,
    endsAt,
    durationMinutes,
    type: durationMinutes > 30 ? 'surgery' : 'checkup',
    status: 'scheduled',
    createdAt: '2026-09-10T10:00:00Z',
  }
}

const slots = [
  slot('2026-09-17T05:00:00Z', '2026-09-17T05:30:00Z', false),
  slot('2026-09-17T05:30:00Z', '2026-09-17T06:00:00Z', false),
  slot('2026-09-17T06:00:00Z', '2026-09-17T06:30:00Z'),
]

describe('buildDayRows', () => {
  it('labels rows with the clinic time', () => {
    const rows = buildDayRows([], slots)

    expect(rows.map((row) => row.label)).toEqual(['07:00', '07:30', '08:00'])
  })

  it('places an appointment in the slot it starts in', () => {
    const rows = buildDayRows(
      [appointment('a1', '2026-09-17T05:00:00Z', '2026-09-17T05:30:00Z')],
      slots,
    )

    expect(rows[0].starting.map((item) => item.id)).toEqual(['a1'])
    expect(rows[1].starting).toHaveLength(0)
  })

  it('marks later slots of a long appointment as continuing', () => {
    const surgery = appointment('s1', '2026-09-17T05:00:00Z', '2026-09-17T06:00:00Z', 60)
    const rows = buildDayRows([surgery], slots)

    expect(rows[0].starting.map((item) => item.id)).toEqual(['s1'])
    expect(rows[1].continuing.map((item) => item.id)).toEqual(['s1'])
    expect(rows[2].continuing).toHaveLength(0)
  })

  it('marks a slot free only when it is available and nothing starts there', () => {
    const rows = buildDayRows(
      [appointment('a1', '2026-09-17T06:00:00Z', '2026-09-17T06:30:00Z')],
      slots,
    )

    expect(rows[0].isFree).toBe(false)
    expect(rows[2].isFree).toBe(false)
    expect(buildDayRows([], slots)[2].isFree).toBe(true)
  })
})

describe('appointmentsOutsideSlots', () => {
  it('returns appointments that start in no slot', () => {
    const early = appointment('e1', '2026-09-17T03:00:00Z', '2026-09-17T03:30:00Z')
    const inside = appointment('i1', '2026-09-17T06:00:00Z', '2026-09-17T06:30:00Z')

    expect(appointmentsOutsideSlots([early, inside], slots).map((item) => item.id)).toEqual(['e1'])
  })
})
