import { useMutation, useQueryClient } from '@tanstack/react-query'
import { examinationKeys, payExamination } from '@/features/examinations'
import { reportKeys } from '../api/reportKeys'

export function usePayFromReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (examinationId: string) => payExamination(examinationId),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: reportKeys.all }),
        queryClient.invalidateQueries({ queryKey: examinationKeys.patients }),
      ]),
  })
}
