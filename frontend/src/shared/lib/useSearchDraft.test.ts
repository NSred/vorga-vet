import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSearchDraft } from './useSearchDraft'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function renderDraft(committed: string, onCommit = vi.fn()) {
  const hook = renderHook(({ value }) => useSearchDraft(value, onCommit), {
    initialProps: { value: committed },
  })
  return { ...hook, onCommit }
}

describe('useSearchDraft', () => {
  it('starts from the committed search', () => {
    const { result } = renderDraft('luna')

    expect(result.current[0]).toBe('luna')
  })

  it('commits the draft once typing pauses', () => {
    const { result, onCommit } = renderDraft('')

    act(() => result.current[1]('l'))
    act(() => result.current[1]('lu'))
    act(() => vi.advanceTimersByTime(300))

    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith('lu')
  })

  it('does not commit what is already committed', () => {
    const { result, onCommit } = renderDraft('luna')

    act(() => result.current[1]('lun'))
    act(() => result.current[1]('luna'))
    act(() => vi.advanceTimersByTime(300))

    expect(onCommit).not.toHaveBeenCalled()
  })

  it('does not bring back an old search after the draft is cleared', () => {
    const { result, rerender, onCommit } = renderDraft('')

    act(() => result.current[1]('luna'))
    act(() => vi.advanceTimersByTime(300))
    expect(onCommit).toHaveBeenLastCalledWith('luna')
    rerender({ value: 'luna' })

    act(() => result.current[1](''))
    rerender({ value: '' })
    act(() => vi.advanceTimersByTime(300))

    expect(onCommit).toHaveBeenCalledTimes(1)
  })
})
