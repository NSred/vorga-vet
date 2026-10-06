import { useQueries } from '@tanstack/react-query'
import { getExaminationCharges } from '../api/chargesApi'
import { priceListKeys } from '../api/priceListKeys'
import type { ChargeLine } from '../types'

export interface ChargesByExamination {
  byExamination: Map<string, ChargeLine[]>
  isPending: boolean
}

export function useChargesForExaminations(examinationIds: string[]): ChargesByExamination {
  return useQueries({
    queries: examinationIds.map((examinationId) => ({
      queryKey: priceListKeys.charges(examinationId),
      queryFn: () => getExaminationCharges(examinationId),
      meta: { errorTitle: 'Could not load the charges' },
    })),
    combine: (results) => {
      const byExamination = new Map<string, ChargeLine[]>()
      results.forEach((result, index) => {
        if (result.data) byExamination.set(examinationIds[index], result.data)
      })
      return { byExamination, isPending: results.some((result) => result.isPending) }
    },
  })
}
