import { ApiError } from '@/shared/lib/apiClient'

export const diagnosisErrors = {
  notFound: 'Diagnoses.NotFound',
  nameNotUnique: 'Diagnoses.NameNotUnique',
  codeNotUnique: 'Diagnoses.CodeNotUnique',
  validation: 'Validation.General',
} as const

export const DUPLICATE_DIAGNOSIS_MESSAGE =
  'This diagnosis is already on the list. If it was retired, find it under Retired and restore it.'

export const DUPLICATE_CODE_MESSAGE = 'Another diagnosis already uses this code.'

export function diagnosisErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback
  if (error.validationMessages) return error.validationMessages.join(' ')
  return fallback
}
