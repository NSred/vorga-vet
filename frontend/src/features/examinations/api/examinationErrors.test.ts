import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/lib/apiClient'
import { examinationErrorMessage, examinationErrors } from './examinationErrors'

describe('examinationErrors', () => {
  it('mirrors the backend catalog', () => {
    expect(Object.values(examinationErrors)).toEqual([
      'Examinations.NotFound',
      'Examinations.AlreadyPaid',
      'Examinations.AppointmentAlreadyHasExamination',
      'Patients.NotFound',
      'Attachments.NotFound',
      'Attachments.UnsupportedContentType',
      'Attachments.EmptyFile',
      'Attachments.FileTooLarge',
      'Attachments.ContentMissing',
    ])
  })
})

describe('examinationErrorMessage', () => {
  it('maps known codes, joins validation messages, falls back otherwise', () => {
    expect(
      examinationErrorMessage(new ApiError(400, 'x', examinationErrors.alreadyPaid), 'fallback'),
    ).toBe('This examination is already marked as paid.')
    expect(examinationErrorMessage(new ApiError(400, 'x', 'Validation', ['A.', 'B.']), 'f')).toBe(
      'A. B.',
    )
    expect(examinationErrorMessage(new Error('x'), 'fallback')).toBe('fallback')
  })
})
