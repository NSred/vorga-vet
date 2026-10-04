import { describe, expect, it } from 'vitest'
import { toCreateRequest, toRescheduleRequest } from './appointmentRequest'
import type { AppointmentWriteValues } from '../types'

const values: AppointmentWriteValues = {
  date: '2026-09-17',
  startsAt: '2026-09-17T07:00:00.000Z',
  type: 'checkup',
  durationMinutes: 30,
  owner: null,
  patient: null,
  reason: '  ',
}

describe('toCreateRequest', () => {
  it('maps the type and drops empty optionals', () => {
    expect(toCreateRequest(values)).toEqual({
      ownerId: undefined,
      patientId: undefined,
      startsAt: '2026-09-17T07:00:00.000Z',
      durationMinutes: 30,
      type: 1,
      reason: undefined,
    })
  })

  it('keeps parties, reason and a surgery duration', () => {
    const request = toCreateRequest({
      ...values,
      type: 'surgery',
      durationMinutes: 90,
      owner: { id: 'o1', label: 'Ana' },
      patient: { id: 'p1', label: 'Luna' },
      reason: ' limping ',
    })

    expect(request).toMatchObject({
      ownerId: 'o1',
      patientId: 'p1',
      durationMinutes: 90,
      type: 3,
      reason: 'limping',
    })
  })

  it('forces 30 minutes for anything but a surgery', () => {
    expect(toCreateRequest({ ...values, durationMinutes: 90 }).durationMinutes).toBe(30)
  })
})

describe('toRescheduleRequest', () => {
  it('sends a duration only for a surgery', () => {
    expect(toRescheduleRequest(values)).toEqual({
      startsAt: '2026-09-17T07:00:00.000Z',
      durationMinutes: undefined,
    })
    expect(toRescheduleRequest({ ...values, type: 'surgery', durationMinutes: 60 })).toEqual({
      startsAt: '2026-09-17T07:00:00.000Z',
      durationMinutes: 60,
    })
  })
})
