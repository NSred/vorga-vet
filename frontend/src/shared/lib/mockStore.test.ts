import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockStore, type MockStoreOptions } from './mockStore'

const KEY = 'vorgavet.mock.test'

interface Notes {
  notes: string[]
}

function storeWith(overrides: Partial<MockStoreOptions<Notes>> = {}) {
  return createMockStore<Notes>({
    key: KEY,
    version: 2,
    isValid: (value) => Array.isArray(value.notes),
    initial: () => ({ notes: ['seed'] }),
    ...overrides,
  })
}

function saved(value: unknown): void {
  window.localStorage.setItem(KEY, JSON.stringify(value))
}

beforeEach(() => {
  window.localStorage.removeItem(KEY)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createMockStore', () => {
  it('starts from the initial state when nothing is saved', () => {
    expect(storeWith().state().notes).toEqual(['seed'])
  })

  it('writes the state with its version and reads it back in a new store', () => {
    const first = storeWith()
    first.state().notes.push('added')
    first.commit()

    expect(JSON.parse(window.localStorage.getItem(KEY) ?? '')).toEqual({
      notes: ['seed', 'added'],
      version: 2,
    })
    expect(storeWith().state().notes).toEqual(['seed', 'added'])
  })

  it('falls back to the initial state for unreadable JSON or the wrong shape', () => {
    window.localStorage.setItem(KEY, '{not json')
    expect(storeWith().state().notes).toEqual(['seed'])

    saved({ version: 2, notes: 'not a list' })
    expect(storeWith().state().notes).toEqual(['seed'])
  })

  it('upgrades an older version and discards it when there is no upgrade', () => {
    saved({ version: 1, notes: ['old'] })

    const upgraded = storeWith({
      upgrade: (value) =>
        value.version === 1 ? { notes: [...(value.notes as string[]), 'v2'] } : null,
    })
    expect(upgraded.state().notes).toEqual(['old', 'v2'])
    expect(storeWith().state().notes).toEqual(['seed'])
  })

  it('keeps changes in memory when storage refuses writes', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    const store = storeWith()
    store.state().notes.push('kept')

    expect(() => store.commit()).not.toThrow()
    expect(store.state().notes).toEqual(['seed', 'kept'])
  })

  it('reset clears both the cached state and the saved entry', () => {
    const store = storeWith()
    store.state().notes.push('added')
    store.commit()

    store.reset()

    expect(window.localStorage.getItem(KEY)).toBeNull()
    expect(store.state().notes).toEqual(['seed'])
  })
})
