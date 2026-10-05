import { ApiError } from '@/shared/lib/apiClient'

export const vaccinationErrors = {
  notFound: 'Vaccinations.NotFound',
  fromExam: 'Vaccinations.FromExam',
  reminderNotFound: 'Reminders.NotFound',
  certificateNotFound: 'Certificates.NotFound',
  certificateNotRabies: 'Certificates.NotRabies',
  certificateAlreadyIssued: 'Certificates.AlreadyIssued',
  certificateNumberNotUnique: 'Certificates.NumberNotUnique',
  validation: 'Validation.General',
} as const

export function vaccinationErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback
  if (error.validationMessages) return error.validationMessages.join(' ')
  return fallback
}
