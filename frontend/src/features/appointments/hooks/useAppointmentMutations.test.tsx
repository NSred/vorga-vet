import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, QueryWrapper } from '@/test/renderWithQuery'
import { appointmentKeys } from '../api/appointmentKeys'
import * as appointmentsApi from '../api/appointmentsApi'
import {
  useCancelAppointment,
  useCreateAppointment,
  useMarkNoShow,
  useRescheduleAppointment,
} from './useAppointmentMutations'

afterEach(() => {
  vi.restoreAllMocks()
})

function setup<T>(hook: () => T) {
  const client = createTestQueryClient()
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryWrapper client={client}>{children}</QueryWrapper>
  )
  const { result } = renderHook(hook, { wrapper })

  return { result, invalidate }
}

const createRequest = {
  startsAt: '2026-09-17T07:00:00.000Z',
  durationMinutes: 30,
  type: 1,
}

describe('appointment mutations', () => {
  it('useCreateAppointment invalidates on success and passes only the request', async () => {
    const spy = vi.spyOn(appointmentsApi, 'createAppointment').mockResolvedValue('a1')
    const { result, invalidate } = setup(() => useCreateAppointment())

    result.current.mutate(createRequest)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith(createRequest)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: appointmentKeys.all })
  })

  it('useRescheduleAppointment invalidates on success', async () => {
    const spy = vi.spyOn(appointmentsApi, 'rescheduleAppointment').mockResolvedValue(undefined)
    const { result, invalidate } = setup(() => useRescheduleAppointment())

    result.current.mutate({ id: 'a1', request: { startsAt: '2026-09-17T08:00:00.000Z' } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith('a1', { startsAt: '2026-09-17T08:00:00.000Z' })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: appointmentKeys.all })
  })

  it('useCancelAppointment invalidates on success', async () => {
    const spy = vi.spyOn(appointmentsApi, 'cancelAppointment').mockResolvedValue(undefined)
    const { result, invalidate } = setup(() => useCancelAppointment())

    result.current.mutate({ id: 'a1', reason: 'owner called' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith('a1', 'owner called')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: appointmentKeys.all })
  })

  it('useMarkNoShow invalidates on success', async () => {
    const spy = vi.spyOn(appointmentsApi, 'markNoShow').mockResolvedValue(undefined)
    const { result, invalidate } = setup(() => useMarkNoShow())

    result.current.mutate({ id: 'a1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(spy).toHaveBeenCalledWith('a1', undefined)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: appointmentKeys.all })
  })

  it('leaves the cache alone on failure', async () => {
    vi.spyOn(appointmentsApi, 'createAppointment').mockRejectedValue(new Error('nope'))
    const { result, invalidate } = setup(() => useCreateAppointment())

    result.current.mutate(createRequest)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidate).not.toHaveBeenCalled()
  })
})
