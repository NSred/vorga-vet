import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getLastIssuer,
  getPatientCertificates,
  issueRabiesCertificate,
} from '../api/certificatesApi'
import { vaccinationKeys } from '../api/vaccinationKeys'
import type { IssueCertificateRequest } from '../types'

export function usePatientCertificates(patientId: string) {
  return useQuery({
    queryKey: vaccinationKeys.certificates(patientId),
    queryFn: () => getPatientCertificates(patientId),
    meta: { errorTitle: 'Could not load the certificates' },
  })
}

export function useLastIssuer(enabled: boolean) {
  return useQuery({
    queryKey: vaccinationKeys.lastIssuer(),
    queryFn: getLastIssuer,
    enabled,
  })
}

export function useIssueCertificate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      vaccinationId,
      request,
    }: {
      vaccinationId: string
      request: IssueCertificateRequest
    }) => issueRabiesCertificate(vaccinationId, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vaccinationKeys.all }),
  })
}
