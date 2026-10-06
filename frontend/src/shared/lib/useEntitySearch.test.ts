import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryWrapper } from '@/test/renderWithQuery'
import { useEntitySearch, usePagedEntitySearch } from './useEntitySearch'

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useEntitySearch', () => {
  it('fetches nothing until the dropdown is opened', async () => {
    const fetcher = vi.fn().mockResolvedValue([{ id: '1' }])

    const { result } = renderHook(() => useEntitySearch(['entities'], fetcher), {
      wrapper: QueryWrapper,
    })

    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    expect(fetcher).not.toHaveBeenCalled()

    act(() => result.current.activate())

    await waitFor(() => expect(result.current.results).toEqual([{ id: '1' }]))
    expect(fetcher).toHaveBeenCalledWith('')
  })

  it('debounces query changes into a single fetch', async () => {
    const fetcher = vi.fn().mockResolvedValue([])
    const { result } = renderHook(() => useEntitySearch(['entities'], fetcher), {
      wrapper: QueryWrapper,
    })

    act(() => result.current.activate())
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

    const { result } = renderHook(() => useEntitySearch(['entities'], fetcher), {
      wrapper: QueryWrapper,
    })
    act(() => result.current.activate())

    await waitFor(() => expect(result.current.errorMessage).toBe('Network down'))
    expect(result.current.results).toEqual([])
  })

  it('shares one request between hooks with the same key', async () => {
    const fetcher = vi.fn().mockResolvedValue([{ id: '1' }])

    const { result } = renderHook(
      () => [useEntitySearch(['allergens'], fetcher), useEntitySearch(['allergens'], fetcher)],
      { wrapper: QueryWrapper },
    )
    act(() => {
      result.current[0].activate()
      result.current[1].activate()
    })

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
  })
})

describe('usePagedEntitySearch', () => {
  function pages(total: number, pageSize: number) {
    return vi.fn(async (_search: string, page: number) => ({
      items: Array.from(
        { length: Math.max(0, Math.min(pageSize, total - (page - 1) * pageSize)) },
        (_, index) => ({ id: `${(page - 1) * pageSize + index}` }),
      ),
      totalCount: total,
      page,
      pageSize,
    }))
  }

  it('loads the first page on open and the next pages on demand, then stops', async () => {
    const fetchPage = pages(32, 15)
    const { result } = renderHook(() => usePagedEntitySearch(['entities'], fetchPage), {
      wrapper: QueryWrapper,
    })

    expect(fetchPage).not.toHaveBeenCalled()
    act(() => result.current.activate())

    await waitFor(() => expect(result.current.results).toHaveLength(15))
    expect(result.current.hasMore).toBe(true)

    act(() => result.current.loadMore())
    await waitFor(() => expect(result.current.results).toHaveLength(30))

    act(() => result.current.loadMore())
    await waitFor(() => expect(result.current.results).toHaveLength(32))
    expect(result.current.hasMore).toBe(false)
    expect(fetchPage.mock.calls.map(([, page]) => page)).toEqual([1, 2, 3])
  })

  it('starts again from the first page for a new search', async () => {
    const fetchPage = pages(32, 15)
    const { result } = renderHook(() => usePagedEntitySearch(['entities'], fetchPage), {
      wrapper: QueryWrapper,
    })
    act(() => result.current.activate())
    await waitFor(() => expect(result.current.results).toHaveLength(15))

    act(() => result.current.setQuery('rex'))
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    await waitFor(() => expect(fetchPage).toHaveBeenLastCalledWith('rex', 1))
  })
})
