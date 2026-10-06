import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/lib/apiClient'
import { CHARGES_STORAGE_KEY, getCharges, resetChargesStore, saveCharges } from './mockChargesStore'

const line = {
  id: 'e1-1',
  kind: 'service' as const,
  itemId: 's1',
  name: 'Obrada rane',
  unitPrice: 1200,
  quantity: 1,
  dose: null,
}

function messagesOf(action: () => void): string[] | undefined {
  try {
    action()
  } catch (error) {
    return error instanceof ApiError ? error.validationMessages : ['not an ApiError']
  }
  return undefined
}

beforeEach(() => {
  resetChargesStore()
})

describe('mock charges store', () => {
  it('returns no lines for an exam without charges', () => {
    expect(getCharges('unknown')).toEqual({ lines: [] })
  })

  it('replaces the lines of one exam and leaves others alone', () => {
    saveCharges('e1', [line])
    saveCharges('e2', [{ ...line, id: 'e2-1' }])
    saveCharges('e1', [{ ...line, name: ' Kontrolni pregled ', unitPrice: 800 }])

    expect(getCharges('e1').lines).toEqual([{ ...line, name: 'Kontrolni pregled', unitPrice: 800 }])
    expect(getCharges('e2').lines).toHaveLength(1)
  })

  it('drops the entry when the lines are cleared', () => {
    saveCharges('e1', [line])
    saveCharges('e1', [])

    expect(window.localStorage.getItem(CHARGES_STORAGE_KEY)).not.toContain('e1')
  })

  it('validates every line', () => {
    expect(
      messagesOf(() =>
        saveCharges('e1', [
          { ...line, name: ' ', quantity: 0 },
          { ...line, kind: 'extra', unitPrice: 1.234 },
          { ...line, dose: 'only for medications' },
        ]),
      ),
    ).toEqual([
      'Line 1: name is required.',
      'Line 1: quantity must be above 0 with at most two decimals.',
      'Line 2: price must be 0 or more with at most two decimals.',
      'Line 2: an additional cost has no item.',
      'Line 3: a dose up to 100 characters is allowed on medication lines only.',
    ])
  })

  it('reads back what was saved after a reload', async () => {
    saveCharges('e1', [line])

    vi.resetModules()
    const reloaded = await import('./mockChargesStore')

    expect(reloaded.getCharges('e1').lines).toEqual([line])
  })
})
