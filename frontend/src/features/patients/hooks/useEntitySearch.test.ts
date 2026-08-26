import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEntitySearch } from './useEntitySearch'

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useEntitySearch', () => {
  it('fetches once on mount with an empty query', async () => {
    const fetcher = vi.fn().mockResolvedValue([{ id: '1' }])

    const { result } = renderHook(() => useEntitySearch(fetcher))

    await waitFor(() => expect(result.current.results).toEqual([{ id: '1' }]))
    expect(fetcher).toHaveBeenCalledWith('')
  })

  it('debounces query changes into a single fetch', async () => {
    const fetcher = vi.fn().mockResolvedValue([])
    const { result } = renderHook(() => useEntitySearch(fetcher))

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))

    act(() => result.current.setQuery('B'))
    act(() => result.current.setQuery('Bi'))
    act(() => result.current.setQuery('Bic'))

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
    expect(fetcher).toHaveBeenLastCalledWith('Bic')
  })

  it('exposes an error message when the fetch rejects', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('Network down'))

    const { result } = renderHook(() => useEntitySearch(fetcher))

    await waitFor(() => expect(result.current.errorMessage).toBe('Network down'))
    expect(result.current.results).toEqual([])
  })

  it('does not fetch while disabled', async () => {
    const fetcher = vi.fn().mockResolvedValue([{ id: '1' }])

    const { result } = renderHook(() => useEntitySearch(fetcher, false))

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(fetcher).not.toHaveBeenCalled()
    expect(result.current.results).toEqual([])
  })
})
