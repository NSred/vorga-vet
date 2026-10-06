import { useState } from 'react'
import { useToast } from '../Toast/useToast'

export interface RetireRestoreOptions<T> {
  retire: (item: T) => Promise<unknown>
  restore: (item: T) => Promise<unknown>
  nameOf: (item: T) => string
  onDone: (title: string) => void
}

export interface RetireRestore<T> {
  confirming: T | null
  askRetire: (item: T) => void
  cancelRetire: () => void
  confirmRetire: () => void
  restore: (item: T) => void
  isPending: boolean
}

export function useRetireRestore<T>({
  retire,
  restore,
  nameOf,
  onDone,
}: RetireRestoreOptions<T>): RetireRestore<T> {
  const { showToast } = useToast()
  const [confirming, setConfirming] = useState<T | null>(null)
  const [isPending, setIsPending] = useState(false)

  const run = async (
    action: (item: T) => Promise<unknown>,
    item: T,
    verb: 'retire' | 'restore',
    afterSettled?: () => void,
  ) => {
    setIsPending(true)
    try {
      await action(item)
      afterSettled?.()
      onDone(`${nameOf(item)} was ${verb}d`)
    } catch {
      afterSettled?.()
      showToast({ tone: 'error', title: `Could not ${verb} ${nameOf(item)}` })
    } finally {
      setIsPending(false)
    }
  }

  return {
    confirming,
    askRetire: setConfirming,
    cancelRetire: () => setConfirming(null),
    confirmRetire: () => {
      if (confirming !== null) void run(retire, confirming, 'retire', () => setConfirming(null))
    },
    restore: (item) => void run(restore, item, 'restore'),
    isPending,
  }
}
