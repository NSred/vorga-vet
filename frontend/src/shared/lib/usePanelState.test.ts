import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePanelState } from './usePanelState'

type Panel = { mode: 'create' } | { mode: 'edit'; id: string }

describe('usePanelState', () => {
  it('starts closed with nothing to display', () => {
    const { result } = renderHook(() => usePanelState<Panel>())

    expect(result.current.panel).toEqual({ mode: 'closed' })
    expect(result.current.displayPanel).toEqual({ mode: 'closed' })
  })

  it('keeps showing the last panel while it closes', () => {
    const { result } = renderHook(() => usePanelState<Panel>())

    act(() => result.current.setPanel({ mode: 'edit', id: 'a' }))
    expect(result.current.displayPanel).toEqual({ mode: 'edit', id: 'a' })

    act(() => result.current.closePanel())
    expect(result.current.panel).toEqual({ mode: 'closed' })
    expect(result.current.displayPanel).toEqual({ mode: 'edit', id: 'a' })
  })

  it('switches the displayed panel when another one opens', () => {
    const { result } = renderHook(() => usePanelState<Panel>())

    act(() => result.current.setPanel({ mode: 'edit', id: 'a' }))
    act(() => result.current.setPanel({ mode: 'create' }))

    expect(result.current.displayPanel).toEqual({ mode: 'create' })
  })
})
