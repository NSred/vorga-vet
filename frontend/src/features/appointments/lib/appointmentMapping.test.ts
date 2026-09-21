import { describe, expect, it } from 'vitest'
import { toAppointment, typeFromApi, typeToApi } from './appointmentMapping'
import type { AppointmentDto } from '../types'

const dto: AppointmentDto = {
  id: 'a1',
  createdByUserId: 'u1',
  ownerId: null,
  patientId: null,
  startsAt: '2026-09-17T07:00:00Z',
  endsAt: '2026-09-17T07:30:00Z',
  durationMinutes: 30,
  type: 1,
  status: 0,
  reason: null,
  ownerName: null,
  patientName: null,
  createdAt: '2026-09-10T10:00:00Z',
}

describe('toAppointment', () => {
  it('maps nulls to undefined', () => {
    const appointment = toAppointment(dto)

    expect(appointment.ownerId).toBeUndefined()
    expect(appointment.patientName).toBeUndefined()
    expect(appointment.reason).toBeUndefined()
  })

  it('maps every type', () => {
    expect(toAppointment({ ...dto, type: 0 }).type).toBe('first_visit')
    expect(toAppointment({ ...dto, type: 1 }).type).toBe('checkup')
    expect(toAppointment({ ...dto, type: 2 }).type).toBe('blood_draw')
    expect(toAppointment({ ...dto, type: 3 }).type).toBe('surgery')
  })

  it('maps every status', () => {
    expect(toAppointment({ ...dto, status: 0 }).status).toBe('scheduled')
    expect(toAppointment({ ...dto, status: 1 }).status).toBe('checked_in')
    expect(toAppointment({ ...dto, status: 2 }).status).toBe('completed')
    expect(toAppointment({ ...dto, status: 3 }).status).toBe('no_show')
    expect(toAppointment({ ...dto, status: 4 }).status).toBe('cancelled')
  })

  it('throws on an unknown enum value', () => {
    expect(() => toAppointment({ ...dto, status: 9 })).toThrow(/status/i)
    expect(() => toAppointment({ ...dto, type: 9 })).toThrow(/type/i)
  })
})

describe('typeToApi', () => {
  it('round-trips every type', () => {
    for (const value of [0, 1, 2, 3]) {
      expect(typeToApi(typeFromApi(value))).toBe(value)
    }
  })
})
