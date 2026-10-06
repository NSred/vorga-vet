type Stored = Record<string, unknown>

export interface MockStoreOptions<S extends object> {
  key: string
  version: number
  initial: () => S
  isValid: (value: Stored) => boolean
  upgrade?: (value: Stored & { version: unknown }) => S | null
}

export interface MockStore<S extends object> {
  state: () => S
  commit: () => void
  reset: () => void
}

function isObject(value: unknown): value is Stored {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function createMockStore<S extends object>({
  key,
  version,
  initial,
  isValid,
  upgrade,
}: MockStoreOptions<S>): MockStore<S> {
  let cached: S | null = null

  const read = (): S | null => {
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) return null
      const parsed: unknown = JSON.parse(raw)
      if (!isObject(parsed) || !isValid(parsed)) return null
      if (parsed.version === version) return parsed as S
      return upgrade ? upgrade({ ...parsed, version: parsed.version }) : null
    } catch {
      return null
    }
  }

  return {
    state: () => {
      cached ??= read() ?? initial()
      return cached
    },
    commit: () => {
      if (!cached) return
      try {
        window.localStorage.setItem(key, JSON.stringify({ ...cached, version }))
      } catch {
        return
      }
    },
    reset: () => {
      cached = null
      try {
        window.localStorage.removeItem(key)
      } catch {
        return
      }
    },
  }
}

export function newId(prefix: string): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
