import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getExchangeRate, setExchangeRate } from '../api/exchangeRateApi'
import { priceListKeys } from '../api/priceListKeys'

export function useExchangeRate() {
  return useQuery({
    queryKey: priceListKeys.exchangeRate(),
    queryFn: getExchangeRate,
    meta: { errorTitle: 'Could not load the euro rate' },
  })
}

export function useEuroRate(): number | undefined {
  return useExchangeRate().data?.rsdPerEur ?? undefined
}

export function useSetExchangeRate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: setExchangeRate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: priceListKeys.exchangeRate() }),
  })
}
