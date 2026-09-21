import { describe, expect, it } from 'vitest'
import { countsTowardLoad, isVisible } from './appointmentVisibility'
import type { Appointment, AppointmentStatus } from '../types'

function appointmentWith(status: AppointmentStatus): Appointment {
  return {
    id: 'a1',
    createdByUserId: 'u1',
    startsAt: '2026-09-17T07:00:00Z',
    endsAt: '2026-09-17T07:30:00Z',
    durationMinutes: 30,
    type: 'checkup',
    status,
    createdAt: '2026-09-10T10:00:00Z',
  }
}

describe('countsTowardLoad', () => {
  it('excludes cancelled and no-show', () => {
    expect(countsTowardLoad(appointmentWith('cancelled'))).toBe(false)
    expect(countsTowardLoad(appointmentWith('no_show'))).toBe(false)
    expect(countsTowardLoad(appointmentWith('scheduled'))).toBe(true)
    expect(countsTowardLoad(appointmentWith('checked_in'))).toBe(true)
    expect(countsTowardLoad(appointmentWith('completed'))).toBe(true)
  })
})

describe('isVisible', () => {
  it('hides cancelled and no-show unless asked for', () => {
    expect(isVisible(appointmentWith('cancelled'), false)).toBe(false)
    expect(isVisible(appointmentWith('cancelled'), true)).toBe(true)
    expect(isVisible(appointmentWith('completed'), false)).toBe(true)
  })
})
