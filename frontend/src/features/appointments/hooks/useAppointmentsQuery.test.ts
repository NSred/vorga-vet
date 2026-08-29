import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryWrapper } from '@/test/renderWithQuery'
import * as appointmentsApi from '../api/appointmentsApi'
import { appointmentKeys } from '../api/appointmentKeys'
import { useAppointmentsQuery } from './useAppointmentsQuery'

const appointment = {
  id: 'a1',
  patientId: 'p1',
  date: '2026-08-29',
  time: '09:30',
  type: 'checkup' as const,
  reminderEnabled: false,
  attachments: [],
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
    expect(appointmentKeys.list().slice(0, 1)).toEqual([...appointmentKeys.all])
  })
})

describe('useAppointmentsQuery', () => {
  it('returns the appointment list', async () => {
    const { result } = renderHook(() => useAppointmentsQuery(), { wrapper: QueryWrapper })

    await waitFor(() => expect(result.current.data).toEqual([appointment]))
  })

  it('shares one request between callers', async () => {
    renderHook(
      () => {
        useAppointmentsQuery()
        useAppointmentsQuery()
      },
      { wrapper: QueryWrapper },
    )

    await waitFor(() => expect(getAppointmentsSpy).toHaveBeenCalledTimes(1))
  })

  it('does not fetch while disabled', async () => {
    renderHook(() => useAppointmentsQuery(false), { wrapper: QueryWrapper })

    await waitFor(() => expect(getAppointmentsSpy).not.toHaveBeenCalled())
  })
})
