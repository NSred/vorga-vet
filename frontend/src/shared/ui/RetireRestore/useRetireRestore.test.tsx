import { act, renderHook, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '../Toast/ToastProvider'
import { useRetireRestore } from './useRetireRestore'

interface Item {
  id: string
  name: string
}

const ITEM: Item = { id: '1', name: 'Otitis' }

function wrapper({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}

function setup(overrides: { retire?: () => Promise<unknown>; restore?: () => Promise<unknown> }) {
  const onDone = vi.fn()
  const retire = vi.fn(overrides.retire ?? (() => Promise.resolve()))
  const restore = vi.fn(overrides.restore ?? (() => Promise.resolve()))
  const hook = renderHook(
    () => useRetireRestore<Item>({ retire, restore, nameOf: (item) => item.name, onDone }),
    { wrapper },
  )
  return { ...hook, onDone, retire, restore }
}

describe('useRetireRestore', () => {
  it('asks first, then retires the item it asked about and reports it', async () => {
    const { result, onDone, retire } = setup({})

    act(() => result.current.askRetire(ITEM))
    expect(result.current.confirming).toBe(ITEM)
    expect(retire).not.toHaveBeenCalled()

    act(() => result.current.confirmRetire())

    await waitFor(() => expect(onDone).toHaveBeenCalledWith('Otitis was retired'))
    expect(retire).toHaveBeenCalledWith(ITEM)
    expect(result.current.confirming).toBeNull()
    expect(result.current.isPending).toBe(false)
  })

  it('closes the question and shows an error toast when retiring fails', async () => {
    const { result, onDone } = setup({ retire: () => Promise.reject(new Error('no')) })

    act(() => result.current.askRetire(ITEM))
    act(() => result.current.confirmRetire())

    expect(await screen.findByText('Could not retire Otitis')).toBeInTheDocument()
    expect(result.current.confirming).toBeNull()
    expect(onDone).not.toHaveBeenCalled()
  })

  it('restores without asking and shows an error toast when that fails', async () => {
    const ok = setup({})
    act(() => ok.result.current.restore(ITEM))
    await waitFor(() => expect(ok.onDone).toHaveBeenCalledWith('Otitis was restored'))

    const failing = setup({ restore: () => Promise.reject(new Error('no')) })
    act(() => failing.result.current.restore(ITEM))
    expect(await screen.findByText('Could not restore Otitis')).toBeInTheDocument()
  })

  it('does nothing on confirm when nothing was asked', () => {
    const { result, retire } = setup({})

    act(() => result.current.confirmRetire())

    expect(retire).not.toHaveBeenCalled()
  })
})
