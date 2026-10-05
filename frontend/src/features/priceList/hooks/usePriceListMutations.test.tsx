import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createTestQueryClient, QueryWrapper } from '@/test/renderWithQuery'
import { resetPriceListStore } from '../api/mockPriceListStore'
import { useCreatePriceListItem, useRetirePriceListItem } from './usePriceListMutations'
import { usePriceListQuery } from './usePriceListQuery'

const ACTIVE = { status: 'active' as const }

function renderWithClient() {
  const client = createTestQueryClient()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryWrapper client={client}>{children}</QueryWrapper>
  )

  return renderHook(
    () => ({
      list: usePriceListQuery('service', ACTIVE, 1, 25),
      create: useCreatePriceListItem(),
      retire: useRetirePriceListItem(),
    }),
    { wrapper },
  )
}

beforeEach(() => {
  resetPriceListStore()
})

describe('price list hooks', () => {
  it('refreshes the visible list after a create', async () => {
    const { result } = renderWithClient()
    await waitFor(() => expect(result.current.list.data?.totalCount).toBe(12))

    await act(() =>
      result.current.create.mutateAsync({
        kind: 'service',
        request: { name: 'Ultrazvuk', price: 3000 },
      }),
    )

    await waitFor(() => expect(result.current.list.data?.totalCount).toBe(13))
  })

  it('drops a retired item from the active list', async () => {
    const { result } = renderWithClient()
    await waitFor(() => expect(result.current.list.data?.totalCount).toBe(12))

    await act(() => result.current.retire.mutateAsync({ kind: 'service', id: 'seed-service-01' }))

    await waitFor(() => expect(result.current.list.data?.totalCount).toBe(11))
    expect(result.current.list.data?.items.some((item) => item.id === 'seed-service-01')).toBe(
      false,
    )
  })
})
