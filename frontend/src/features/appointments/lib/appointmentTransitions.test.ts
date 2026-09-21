import { describe, expect, it } from 'vitest'
import { allowedTransitions, canReschedule, canTransition } from './appointmentTransitions'
import type { AppointmentStatus } from '../types'

const ALL: AppointmentStatus[] = ['scheduled', 'checked_in', 'completed', 'no_show', 'cancelled']

const ALLOWED: Array<[AppointmentStatus, AppointmentStatus]> = [
  ['scheduled', 'checked_in'],
  ['scheduled', 'completed'],
  ['scheduled', 'no_show'],
  ['scheduled', 'cancelled'],
  ['checked_in', 'completed'],
  ['checked_in', 'cancelled'],
]

describe('canTransition', () => {
  it.each(ALLOWED)('allows %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true)
  })

  it('rejects every other pair', () => {
    for (const from of ALL) {
      for (const to of ALL) {
        const allowed = ALLOWED.some(([a, b]) => a === from && b === to)
        expect(canTransition(from, to), `${from} -> ${to}`).toBe(allowed)
      }
    }
  })
})

describe('allowedTransitions', () => {
  it('lists the targets in backend order', () => {
    expect(allowedTransitions('scheduled')).toEqual([
      'checked_in',
      'completed',
      'no_show',
      'cancelled',
    ])
    expect(allowedTransitions('checked_in')).toEqual(['completed', 'cancelled'])
    expect(allowedTransitions('completed')).toEqual([])
  })
})

describe('canReschedule', () => {
  it('is true only while scheduled', () => {
    expect(ALL.filter(canReschedule)).toEqual(['scheduled'])
  })
})
