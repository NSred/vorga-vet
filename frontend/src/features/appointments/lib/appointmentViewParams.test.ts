import { describe, expect, it } from 'vitest'
import { parseViewParams, toViewParams } from './appointmentViewParams'

describe('parseViewParams', () => {
  it('reads the view, date and cancelled flag', () => {
    const params = new URLSearchParams('view=day&date=2026-09-17&cancelled=1')

    expect(parseViewParams(params, '2026-01-01')).toEqual({
      view: 'day',
      date: '2026-09-17',
      showCancelled: true,
    })
  })

  it('falls back to the week view on the given day', () => {
    expect(parseViewParams(new URLSearchParams(), '2026-09-17')).toEqual({
      view: 'week',
      date: '2026-09-17',
      showCancelled: false,
    })
  })

  it('ignores an unknown view and a malformed date', () => {
    const params = new URLSearchParams('view=decade&date=yesterday')

    expect(parseViewParams(params, '2026-09-17')).toEqual({
      view: 'week',
      date: '2026-09-17',
      showCancelled: false,
    })
  })
})

describe('toViewParams', () => {
  it('writes the view and date, and the flag only when set', () => {
    expect(toViewParams({ view: 'day', date: '2026-09-17', showCancelled: false }).toString()).toBe(
      'view=day&date=2026-09-17',
    )
    expect(toViewParams({ view: 'month', date: '2026-09-17', showCancelled: true }).toString()).toBe(
      'view=month&date=2026-09-17&cancelled=1',
    )
  })

  it('round-trips through parseViewParams', () => {
    const state = { view: 'month' as const, date: '2026-12-01', showCancelled: true }

    expect(parseViewParams(toViewParams(state), '2026-09-17')).toEqual(state)
  })
})
