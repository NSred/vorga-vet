import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createPriceListItem,
  restorePriceListItem,
  retirePriceListItem,
  updatePriceListItem,
} from '../api/priceListApi'
import { priceListKeys } from '../api/priceListKeys'
import type { PriceListKind, PriceListWriteRequest } from '../types'

function useInvalidatePriceList() {
  const queryClient = useQueryClient()

  return () => queryClient.invalidateQueries({ queryKey: priceListKeys.all })
}

export function useCreatePriceListItem() {
  const invalidate = useInvalidatePriceList()

  return useMutation({
    mutationFn: ({ kind, request }: { kind: PriceListKind; request: PriceListWriteRequest }) =>
      createPriceListItem(kind, request),
    onSuccess: invalidate,
  })
}

export function useUpdatePriceListItem() {
  const invalidate = useInvalidatePriceList()

  return useMutation({
    mutationFn: ({
      kind,
      id,
      request,
    }: {
      kind: PriceListKind
      id: string
      request: PriceListWriteRequest
    }) => updatePriceListItem(kind, id, request),
    onSuccess: invalidate,
  })
}

export function useRetirePriceListItem() {
  const invalidate = useInvalidatePriceList()

  return useMutation({
    mutationFn: ({ kind, id }: { kind: PriceListKind; id: string }) =>
      retirePriceListItem(kind, id),
    onSuccess: invalidate,
  })
}

export function useRestorePriceListItem() {
  const invalidate = useInvalidatePriceList()

  return useMutation({
    mutationFn: ({ kind, id }: { kind: PriceListKind; id: string }) =>
      restorePriceListItem(kind, id),
    onSuccess: invalidate,
  })
}
