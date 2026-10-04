import { describe, expect, it } from 'vitest'
import { isSelectable, slotOptions } from './slotOptions'
import type { AvailabilitySlot } from '../types'

const slots: AvailabilitySlot[] = [
  {
    startsAt: '2026-09-17T05:00:00Z',
    endsAt: '2026-09-17T05:30:00Z',
    isAvailable: true,
    isMine: false,
  },
  {
    startsAt: '2026-09-17T05:30:00Z',
    endsAt: '2026-09-17T06:00:00Z',
    isAvailable: false,
    isMine: false,
  },
  {
    startsAt: '2026-09-17T06:00:00Z',
    endsAt: '2026-09-17T06:30:00Z',
    isAvailable: false,
    isMine: false,
  },
]

describe('slotOptions', () => {
  it('labels slots in clinic time and disables taken ones', () => {
    const options = slotOptions(slots)

    expect(options.map((option) => option.label)).toEqual(['07:00', '07:30', '08:00'])
    expect(options.map((option) => option.disabled)).toEqual([false, true, true])
  })

  it('keeps the slots of the appointment being moved selectable', () => {
    const current = { startsAt: '2026-09-17T05:30:00Z', endsAt: '2026-09-17T06:30:00Z' }

    const options = slotOptions(slots, current)

    expect(options.map((option) => option.disabled)).toEqual([false, false, false])
  })

  it('reports whether a value is still selectable', () => {
    const options = slotOptions(slots)

    expect(isSelectable(options, '2026-09-17T05:00:00Z')).toBe(true)
    expect(isSelectable(options, '2026-09-17T05:30:00Z')).toBe(false)
    expect(isSelectable(options, '2026-09-17T09:00:00Z')).toBe(false)
  })

  it('omits slots that have already started', () => {
    const options = slotOptions(slots, undefined, Date.parse('2026-09-17T05:15:00Z'))

    expect(options.map((option) => option.value)).toEqual([
      '2026-09-17T05:30:00Z',
      '2026-09-17T06:00:00Z',
    ])
  })
})

describe('slotOptions isMine', () => {
  it('flags the slots the caller already booked', () => {
    const mine: AvailabilitySlot[] = [
      {
        startsAt: '2026-09-17T05:00:00Z',
        endsAt: '2026-09-17T05:30:00Z',
        isAvailable: true,
        isMine: false,
      },
      {
        startsAt: '2026-09-17T05:30:00Z',
        endsAt: '2026-09-17T06:00:00Z',
        isAvailable: false,
        isMine: true,
      },
    ]

    expect(slotOptions(mine).map((option) => option.isMine)).toEqual([false, true])
  })
})
