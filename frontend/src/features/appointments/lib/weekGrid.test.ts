import { describe, expect, it } from 'vitest'
import { layoutWeek } from './weekGrid'
import type { Appointment, AvailabilitySlot } from '../types'

function slot(startsAt: string, endsAt: string): AvailabilitySlot {
  return { startsAt, endsAt, isAvailable: true, isMine: false }
}

function appointment(id: string, startsAt: string, durationMinutes: number): Appointment {
  return {
    id,
    createdByUserId: 'u1',
    startsAt,
    endsAt: new Date(Date.parse(startsAt) + durationMinutes * 60_000).toISOString(),
    durationMinutes,
    type: 'checkup',
    status: 'scheduled',
    createdAt: '2026-09-10T10:00:00Z',
  }
}

const dates = ['2026-09-21', '2026-09-22']
const slots = [
  slot('2026-09-21T05:00:00Z', '2026-09-21T05:30:00Z'),
  slot('2026-09-21T05:30:00Z', '2026-09-21T06:00:00Z'),
  slot('2026-09-21T06:00:00Z', '2026-09-21T06:30:00Z'),
]

describe('layoutWeek', () => {
  it('builds one row per half hour across the week, in clinic time', () => {
    const { rows } = layoutWeek(dates, [], slots, true)

    expect(rows.map((row) => row.label)).toEqual(['07:00', '07:30', '08:00'])
  })

  it('places a visit on its clinic day and stretches it over its length', () => {
    const visit = appointment('a', '2026-09-21T05:30:00Z', 60)
    const layout = layoutWeek(dates, [visit], slots, true)

    expect(layout.days[0].blocks).toEqual([{ appointment: visit, row: 1, span: 2, lane: 0 }])
    expect(layout.days[1].blocks).toEqual([])
    expect(layout.rows.map((row) => row.isBusy)).toEqual([false, true, true])
  })

  it('stretches a 45-minute visit over both rows it touches', () => {
    const visit = appointment('a', '2026-09-21T05:00:00Z', 45)

    expect(layoutWeek(dates, [visit], slots, true).days[0].blocks[0].span).toBe(2)
  })

  it('puts overlapping visits of one day side by side', () => {
    const first = appointment('a', '2026-09-21T05:00:00Z', 60)
    const second = appointment('b', '2026-09-21T05:30:00Z', 30)
    const day = layoutWeek(dates, [second, first], slots, true).days[0]

    expect(day.blocks.map((block) => [block.appointment.id, block.lane])).toEqual([
      ['a', 0],
      ['b', 1],
    ])
    expect(day.laneCount).toBe(2)
  })

  it('marks a day without slots as closed, and its open rows otherwise', () => {
    const { days } = layoutWeek(dates, [], slots, true)

    expect(days[0].isClosed).toBe(false)
    expect([...days[0].openRows]).toEqual([0, 1, 2])
    expect(days[1].isClosed).toBe(true)
    expect(layoutWeek(dates, [], [], false).days[1].isClosed).toBe(false)
  })

  it('extends the rows to a visit outside opening hours, and falls back to the working day', () => {
    const late = appointment('late', '2026-09-22T16:00:00Z', 30)

    expect(layoutWeek(dates, [late], slots, true).rows.at(-1)?.label).toBe('18:00')
    expect(layoutWeek(dates, [], [], false).rows.map((row) => row.label)).toHaveLength(26)
  })
})
