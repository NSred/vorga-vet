import { ApiError } from '@/shared/lib/apiClient'

export const appointmentErrors = {
  notFound: 'Appointments.NotFound',
  slotTaken: 'Appointments.SlotTaken',
  invalidTransition: 'Appointments.InvalidTransition',
  surgeryRequiresVeterinarian: 'Appointments.SurgeryRequiresVeterinarian',
  invalidDuration: 'Appointments.InvalidDuration',
  patientDoesNotBelongToOwner: 'Appointments.PatientDoesNotBelongToOwner',
  invalidRange: 'Appointments.InvalidRange',
  rangeTooWide: 'Appointments.RangeTooWide',
  ownerResolutionRequired: 'Appointments.OwnerResolutionRequired',
  patientResolutionRequired: 'Appointments.PatientResolutionRequired',
  ambiguousResolution: 'Appointments.AmbiguousResolution',
  onlyScheduledCanBeRescheduled: 'Appointments.OnlyScheduledCanBeRescheduled',
  ownerNotFound: 'Owners.NotFound',
  patientNotFound: 'Patients.NotFound',
} as const

const MESSAGES: Partial<Record<string, string>> = {
  [appointmentErrors.notFound]: 'That appointment no longer exists.',
  [appointmentErrors.slotTaken]: 'That time is already booked. Pick another slot.',
  [appointmentErrors.invalidTransition]: 'That change is not possible from the current status.',
  [appointmentErrors.onlyScheduledCanBeRescheduled]:
    'Only an appointment that is still scheduled can be moved.',
}

export function appointmentErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback

  const known = error.code ? MESSAGES[error.code] : undefined
  if (known) return known

  if (error.validationMessages) return error.validationMessages.join(' ')

  return fallback
}
