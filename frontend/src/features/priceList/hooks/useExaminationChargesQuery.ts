import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getExaminationCharges, saveExaminationCharges } from '../api/chargesApi'
import { priceListKeys } from '../api/priceListKeys'
import type { ChargeLine } from '../types'

export function useExaminationChargesQuery(examinationId: string | undefined) {
  return useQuery({
    queryKey: priceListKeys.charges(examinationId ?? ''),
    queryFn: () => getExaminationCharges(examinationId ?? ''),
    enabled: Boolean(examinationId),
    meta: { errorTitle: 'Could not load the charges' },
  })
}

export function useSaveExaminationCharges() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ examinationId, lines }: { examinationId: string; lines: ChargeLine[] }) =>
      saveExaminationCharges(examinationId, lines),
    onSuccess: (_, { examinationId }) =>
      queryClient.invalidateQueries({ queryKey: priceListKeys.charges(examinationId) }),
  })
}
