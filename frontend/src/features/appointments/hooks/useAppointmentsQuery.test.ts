import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryWrapper } from '@/test/renderWithQuery'
import * as appointmentsApi from '../api/appointmentsApi'
import { appointmentKeys } from '../api/appointmentKeys'
import { useAppointmentsQuery } from './useAppointmentsQuery'
import type { Appointment } from '../types'

const range = { from: '2026-09-16T22:00:00.000Z', to: '2026-09-17T22:00:00.000Z' }
const otherRange = { from: '2026-09-17T22:00:00.000Z', to: '2026-09-18T22:00:00.000Z' }

const appointment: Appointment = {
  id: 'a1',
  createdByUserId: 'u1',
  startsAt: '2026-09-17T07:00:00Z',
  endsAt: '2026-09-17T07:30:00Z',
  durationMinutes: 30,
  type: 'checkup',
  status: 'scheduled',
  createdAt: '2026-09-10T10:00:00Z',
}

let getAppointmentsSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  getAppointmentsSpy = vi.spyOn(appointmentsApi, 'getAppointments').mockResolvedValue([appointment])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('appointmentKeys', () => {
  it('prefixes the list so one invalidation clears it', () => {
    expect(appointmentKeys.list(range).slice(0, 1)).toEqual([...appointmentKeys.all])
  })

  it('keys each range separately', () => {
    expect(appointmentKeys.list(range)).not.toEqual(appointmentKeys.list(otherRange))
  })
})

describe('useAppointmentsQuery', () => {
  it('returns the appointments for the range', async () => {
    const { result } = renderHook(() => useAppointmentsQuery(range), { wrapper: QueryWrapper })

    await waitFor(() => expect(result.current.data).toEqual([appointment]))
    expect(getAppointmentsSpy).toHaveBeenCalledWith(range)
  })

  it('shares one request between callers of the same range', async () => {
    renderHook(
      () => {
        useAppointmentsQuery(range)
        useAppointmentsQuery(range)
      },
      { wrapper: QueryWrapper },
    )

    await waitFor(() => expect(getAppointmentsSpy).toHaveBeenCalledTimes(1))
  })

  it('does not fetch while disabled', async () => {
    renderHook(() => useAppointmentsQuery(range, false), { wrapper: QueryWrapper })

    await waitFor(() => expect(getAppointmentsSpy).not.toHaveBeenCalled())
  })
})
