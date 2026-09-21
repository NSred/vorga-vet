import { ApiError } from '@/shared/lib/apiClient'

export const examinationErrors = {
  notFound: 'Examinations.NotFound',
  alreadyPaid: 'Examinations.AlreadyPaid',
  appointmentAlreadyHasExamination: 'Examinations.AppointmentAlreadyHasExamination',
  patientNotFound: 'Patients.NotFound',
} as const

const MESSAGES: Partial<Record<string, string>> = {
  [examinationErrors.notFound]: 'That examination no longer exists.',
  [examinationErrors.alreadyPaid]: 'This examination is already marked as paid.',
  [examinationErrors.appointmentAlreadyHasExamination]:
    'An examination was already recorded for this appointment.',
  [examinationErrors.patientNotFound]: 'That patient no longer exists.',
}

export function examinationErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback

  const known = error.code ? MESSAGES[error.code] : undefined
  if (known) return known

  if (error.validationMessages) return error.validationMessages.join(' ')

  return fallback
}
