import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, QueryWrapper } from '@/test/renderWithQuery'
import { patientKeys } from '../api/patientKeys'
import * as patientsApi from '../api/patientsApi'
import type { PatientWriteRequest } from '../types'
import { useCreatePatient, useDeletePatient, useUpdatePatient } from './usePatientMutations'

const request: PatientWriteRequest = {
  ownerId: 'o1',
  breedId: 'b1',
  cardNumber: 'D26-00001',
  name: 'Rex',
  sex: 0,
  allergenIds: [],
}

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

describe('useCreatePatient', () => {
  it('invalidates the patients cache on success', async () => {
    vi.spyOn(patientsApi, 'createPatient').mockResolvedValue('p1')
    const { result, invalidate } = setup(() => useCreatePatient())

    result.current.mutate(request)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: patientKeys.all })
  })

  it('exposes the error and leaves the cache alone on failure', async () => {
    vi.spyOn(patientsApi, 'createPatient').mockRejectedValue(new Error('nope'))
    const { result, invalidate } = setup(() => useCreatePatient())

    result.current.mutate(request)

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidate).not.toHaveBeenCalled()
  })
})

describe('useUpdatePatient', () => {
  it('invalidates the patients cache on success', async () => {
    const updateSpy = vi.spyOn(patientsApi, 'updatePatient').mockResolvedValue(undefined)
    const { result, invalidate } = setup(() => useUpdatePatient())

    result.current.mutate({ id: 'p1', request })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(updateSpy).toHaveBeenCalledWith('p1', request)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: patientKeys.all })
  })

  it('exposes the error and leaves the cache alone on failure', async () => {
    vi.spyOn(patientsApi, 'updatePatient').mockRejectedValue(new Error('nope'))
    const { result, invalidate } = setup(() => useUpdatePatient())

    result.current.mutate({ id: 'p1', request })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidate).not.toHaveBeenCalled()
  })
})

describe('useDeletePatient', () => {
  it('invalidates the patients cache on success', async () => {
    vi.spyOn(patientsApi, 'deletePatient').mockResolvedValue(undefined)
    const { result, invalidate } = setup(() => useDeletePatient())

    result.current.mutate('p1')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: patientKeys.all })
  })

  it('exposes the error and leaves the cache alone on failure', async () => {
    vi.spyOn(patientsApi, 'deletePatient').mockRejectedValue(new Error('nope'))
    const { result, invalidate } = setup(() => useDeletePatient())

    result.current.mutate('p1')

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidate).not.toHaveBeenCalled()
  })
})
