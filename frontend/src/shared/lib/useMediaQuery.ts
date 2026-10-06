import { useCallback, useSyncExternalStore } from 'react'

export const PHONE_QUERY = '(max-width: 40rem)'

const hasMatchMedia = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!hasMatchMedia()) return () => {}
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )

  return useSyncExternalStore(
    subscribe,
    () => hasMatchMedia() && window.matchMedia(query).matches,
    () => false,
  )
}
