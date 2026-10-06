import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PHONE_QUERY, useMediaQuery } from './useMediaQuery'

function mockMatchMedia(initial: boolean) {
  let matches = initial
  const listeners = new Set<() => void>()
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      get matches() {
        return matches
      },
      media: query,
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    })),
  )
  return (next: boolean) => {
    matches = next
    listeners.forEach((listener) => listener())
  }
}

describe('useMediaQuery', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('treats a browser without matchMedia as not matching', () => {
    vi.stubGlobal('matchMedia', undefined)

    const { result } = renderHook(() => useMediaQuery(PHONE_QUERY))

    expect(result.current).toBe(false)
  })

  it('reports the current match', () => {
    mockMatchMedia(true)

    const { result } = renderHook(() => useMediaQuery(PHONE_QUERY))

    expect(result.current).toBe(true)
  })

  it('follows a change of the media query', () => {
    const setMatches = mockMatchMedia(false)
    const { result } = renderHook(() => useMediaQuery(PHONE_QUERY))

    act(() => setMatches(true))

    expect(result.current).toBe(true)
  })
})
