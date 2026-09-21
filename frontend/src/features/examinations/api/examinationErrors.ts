import { ApiError } from '@/shared/lib/apiClient'

export const examinationErrors = {
  notFound: 'Examinations.NotFound',
  alreadyPaid: 'Examinations.AlreadyPaid',
  appointmentAlreadyHasExamination: 'Examinations.AppointmentAlreadyHasExamination',
  patientNotFound: 'Patients.NotFound',
  attachmentNotFound: 'Attachments.NotFound',
  unsupportedContentType: 'Attachments.UnsupportedContentType',
  emptyFile: 'Attachments.EmptyFile',
  fileTooLarge: 'Attachments.FileTooLarge',
  contentMissing: 'Attachments.ContentMissing',
} as const

const MESSAGES: Partial<Record<string, string>> = {
  [examinationErrors.notFound]: 'That examination no longer exists.',
  [examinationErrors.alreadyPaid]: 'This examination is already marked as paid.',
  [examinationErrors.appointmentAlreadyHasExamination]:
    'An examination was already recorded for this appointment.',
  [examinationErrors.patientNotFound]: 'That patient no longer exists.',
  [examinationErrors.attachmentNotFound]: 'That image no longer exists.',
  [examinationErrors.unsupportedContentType]: 'Only JPEG, PNG and WebP images can be attached.',
  [examinationErrors.emptyFile]: 'That file is empty.',
  [examinationErrors.fileTooLarge]: 'That file is larger than 20 MB.',
  [examinationErrors.contentMissing]: 'The image file is missing from storage.',
}

export function examinationErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback

  const known = error.code ? MESSAGES[error.code] : undefined
  if (known) return known

  if (error.validationMessages) return error.validationMessages.join(' ')

  return fallback
}
