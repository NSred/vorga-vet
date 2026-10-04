import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, QueryWrapper } from '@/test/renderWithQuery'
import * as appointmentsApi from '@/features/appointments/api/appointmentsApi'
import { useCheckInAppointment, useCompleteAppointment } from './useVisitMutations'

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

function invalidatedRoots(invalidate: ReturnType<typeof vi.spyOn>) {
  return invalidate.mock.calls
    .map((call: unknown[]) => (call[0] as { queryKey: readonly string[] }).queryKey[0])
    .sort()
}

describe('visit mutations', () => {
  it('check-in invalidates appointments, patients and examinations', async () => {
    vi.spyOn(appointmentsApi, 'checkInAppointment').mockResolvedValue({
      ownerId: 'o1',
      patientId: 'p1',
    })
    const { result, invalidate } = setup(() => useCheckInAppointment())

    result.current.mutate({ id: 'a1', request: {} })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidatedRoots(invalidate)).toEqual(['appointments', 'examinations', 'patients'])
  })

  it('complete invalidates the same three roots and returns the examination id', async () => {
    vi.spyOn(appointmentsApi, 'completeAppointment').mockResolvedValue('e1')
    const { result, invalidate } = setup(() => useCompleteAppointment())

    result.current.mutate({
      id: 'a1',
      request: { examination: { performedByFirstName: 'Mira', performedByLastName: 'Vet' } },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe('e1')
    expect(invalidatedRoots(invalidate)).toEqual(['appointments', 'examinations', 'patients'])
  })
})
