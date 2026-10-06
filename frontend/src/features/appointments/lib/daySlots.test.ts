import { describe, expect, it } from 'vitest'
import { appointmentsOutsideSlots, durationLabel, layoutDay } from './daySlots'
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
  slot('2026-09-17T06:30:00Z', '2026-09-17T07:00:00Z'),
]

describe('layoutDay', () => {
  it('labels rows with the clinic time', () => {
    expect(layoutDay([], slots).rows.map((row) => row.label)).toEqual([
      '07:00',
      '07:30',
      '08:00',
      '08:30',
    ])
  })

  it('stretches a block over every slot the appointment covers', () => {
    const surgery = appointment('s1', '2026-09-17T05:00:00Z', '2026-09-17T06:00:00Z', 60)
    const { blocks, rows } = layoutDay([surgery], slots)

    expect(blocks).toEqual([{ appointment: surgery, row: 0, span: 2, lane: 0 }])
    expect(rows.map((row) => row.isBusy)).toEqual([true, true, false, false])
  })

  it('puts overlapping appointments side by side and reuses a lane once it is free', () => {
    const long = appointment('a', '2026-09-17T05:00:00Z', '2026-09-17T06:00:00Z', 60)
    const overlap = appointment('b', '2026-09-17T05:30:00Z', '2026-09-17T06:00:00Z')
    const later = appointment('c', '2026-09-17T06:00:00Z', '2026-09-17T06:30:00Z')
    const { blocks, laneCount } = layoutDay([later, overlap, long], slots)

    expect(blocks.map((block) => [block.appointment.id, block.row, block.lane])).toEqual([
      ['a', 0, 0],
      ['b', 1, 1],
      ['c', 2, 0],
    ])
    expect(laneCount).toBe(2)
  })

  it('marks a slot free only when it is available and nothing covers it', () => {
    const { rows } = layoutDay(
      [appointment('a1', '2026-09-17T06:00:00Z', '2026-09-17T06:30:00Z')],
      slots,
    )

    expect(rows.map((row) => row.isFree)).toEqual([false, false, false, true])
    expect(layoutDay([], slots).laneCount).toBe(1)
  })
})

describe('appointmentsOutsideSlots', () => {
  it('returns appointments that start in no slot', () => {
    const early = appointment('e1', '2026-09-17T03:00:00Z', '2026-09-17T03:30:00Z')
    const inside = appointment('i1', '2026-09-17T06:00:00Z', '2026-09-17T06:30:00Z')

    expect(appointmentsOutsideSlots([early, inside], slots).map((item) => item.id)).toEqual(['e1'])
  })
})

describe('durationLabel', () => {
  it('reads minutes, hours or both', () => {
    expect(durationLabel(30)).toBe('30m')
    expect(durationLabel(60)).toBe('1h')
    expect(durationLabel(90)).toBe('1h 30m')
    expect(durationLabel(120)).toBe('2h')
  })
})
