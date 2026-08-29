import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryWrapper } from '@/test/renderWithQuery'
import * as patientsApi from '../api/patientsApi'
import { useActivePatientCount } from './useActivePatientCount'

beforeEach(() => {
  vi.spyOn(patientsApi, 'getPatients').mockResolvedValue({
    items: [],
    totalCount: 25,
    page: 1,
    pageSize: 10,
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useActivePatientCount', () => {
  it('reports the total count of active patients', async () => {
    const { result } = renderHook(() => useActivePatientCount(), { wrapper: QueryWrapper })

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.count).toBe(25)
  })

  it('requests only active patients', async () => {
    renderHook(() => useActivePatientCount(), { wrapper: QueryWrapper })

    await waitFor(() =>
      expect(patientsApi.getPatients).toHaveBeenCalledWith({ status: 'active' }, 1, 10),
    )
  })

  it('reports zero while still loading', () => {
    const { result } = renderHook(() => useActivePatientCount(), { wrapper: QueryWrapper })

    expect(result.current.isPending).toBe(true)
    expect(result.current.count).toBe(0)
  })
})
