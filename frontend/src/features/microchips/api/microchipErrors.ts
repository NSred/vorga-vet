import { ApiError } from '@/shared/lib/apiClient'

export const microchipErrors = {
  alreadyRegistered: 'Microchips.AlreadyRegistered',
  validation: 'Validation.General',
} as const

export function microchipErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback
  if (error.validationMessages) return error.validationMessages.join(' ')
  return fallback
}
