import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryWrapper } from '@/test/renderWithQuery'
import * as allergensApi from '../api/allergensApi'
import { patientKeys } from '../api/patientKeys'
import { useAllergenByName } from './usePatientsQuery'

let searchAllergensSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  searchAllergensSpy = vi
    .spyOn(allergensApi, 'searchAllergens')
    .mockResolvedValue([{ id: 'a1', name: 'Pollen' }])
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('patientKeys', () => {
  it('prefixes lists and details so one invalidation clears both', () => {
    expect(patientKeys.list({}, 1, 10).slice(0, 1)).toEqual([...patientKeys.all])
    expect(patientKeys.detail('p1').slice(0, 1)).toEqual([...patientKeys.all])
  })

  it('distinguishes different filters', () => {
    expect(patientKeys.list({ species: 'dog' }, 1, 10)).not.toEqual(
      patientKeys.list({ species: 'cat' }, 1, 10),
    )
  })
})

describe('useAllergenByName', () => {
  it('resolves a matching name to its option', async () => {
    const { result } = renderHook(() => useAllergenByName('Pollen'), { wrapper: QueryWrapper })

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.allergen).toEqual({ id: 'a1', name: 'Pollen' })
  })

  it('stops pending when the name matches nothing', async () => {
    searchAllergensSpy.mockResolvedValue([])

    const { result } = renderHook(() => useAllergenByName('Nonexistent'), { wrapper: QueryWrapper })

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.allergen).toBeNull()
  })

  it('stops pending when the lookup fails', async () => {
    searchAllergensSpy.mockRejectedValue(new Error('Network down'))

    const { result } = renderHook(() => useAllergenByName('Pollen'), { wrapper: QueryWrapper })

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.allergen).toBeNull()
  })

  it('is neither pending nor fetching without a name', () => {
    const { result } = renderHook(() => useAllergenByName(undefined), { wrapper: QueryWrapper })

    expect(result.current.isPending).toBe(false)
    expect(result.current.allergen).toBeNull()
    expect(searchAllergensSpy).not.toHaveBeenCalled()
  })
})
