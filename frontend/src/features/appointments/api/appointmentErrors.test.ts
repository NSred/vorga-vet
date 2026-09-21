import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/lib/apiClient'
import { appointmentErrorMessage, appointmentErrors } from './appointmentErrors'

describe('appointmentErrors', () => {
  it('mirrors the backend catalog', () => {
    expect(Object.values(appointmentErrors)).toEqual([
      'Appointments.NotFound',
      'Appointments.SlotTaken',
      'Appointments.InvalidTransition',
      'Appointments.SurgeryRequiresVeterinarian',
      'Appointments.InvalidDuration',
      'Appointments.PatientDoesNotBelongToOwner',
      'Appointments.InvalidRange',
      'Appointments.RangeTooWide',
      'Appointments.OwnerResolutionRequired',
      'Appointments.PatientResolutionRequired',
      'Appointments.AmbiguousResolution',
      'Appointments.OnlyScheduledCanBeRescheduled',
      'Owners.NotFound',
      'Patients.NotFound',
    ])
  })
})

describe('appointmentErrorMessage', () => {
  it('explains a taken slot', () => {
    const error = new ApiError(409, 'detail', appointmentErrors.slotTaken)

    expect(appointmentErrorMessage(error, 'fallback')).toBe(
      'That time is already booked. Pick another slot.',
    )
  })

  it('joins validation messages', () => {
    const error = new ApiError(400, 'detail', 'Validation', ['A.', 'B.'])

    expect(appointmentErrorMessage(error, 'fallback')).toBe('A. B.')
  })

  it('falls back for unknown codes and non-api errors', () => {
    expect(appointmentErrorMessage(new ApiError(500, 'detail'), 'fallback')).toBe('fallback')
    expect(appointmentErrorMessage(new Error('x'), 'fallback')).toBe('fallback')
  })
})
