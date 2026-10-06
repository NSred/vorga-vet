import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createTestQueryClient, QueryWrapper } from '@/test/renderWithQuery'
import { resetChargesStore, saveCharges } from '../api/mockChargesStore'
import { priceListKeys } from '../api/priceListKeys'
import { useChargesForExaminations } from './useChargesForExaminations'

function line(id: string, name: string) {
  return {
    id,
    kind: 'service' as const,
    itemId: null,
    name,
    unitPrice: 1000,
    quantity: 1,
    dose: null,
    vaccine: null,
  }
}

beforeEach(() => {
  resetChargesStore()
  saveCharges('e1', [line('l1', 'Pregled')])
  saveCharges('e2', [line('l2', 'Vakcinacija'), line('l3', 'Čišćenje ušiju')])
})

describe('useChargesForExaminations', () => {
  it("returns each exam's lines, and none for an exam without charges", async () => {
    const client = createTestQueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryWrapper client={client}>{children}</QueryWrapper>
    )

    const { result } = renderHook(() => useChargesForExaminations(['e1', 'e2', 'e3']), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(result.current.byExamination.get('e1')?.map((l) => l.name)).toEqual(['Pregled'])
    expect(result.current.byExamination.get('e2')).toHaveLength(2)
    expect(result.current.byExamination.get('e3')).toEqual([])
  })

  it('shares the cache key the single-exam charges use', async () => {
    const client = createTestQueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryWrapper client={client}>{children}</QueryWrapper>
    )

    const { result } = renderHook(() => useChargesForExaminations(['e1']), { wrapper })

    await waitFor(() => expect(result.current.isPending).toBe(false))
    expect(client.getQueryData(priceListKeys.charges('e1'))).toEqual(
      result.current.byExamination.get('e1'),
    )
  })
})
