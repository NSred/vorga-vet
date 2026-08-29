import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/lib/apiClient'
import { shouldRetry } from './queryClient'

describe('shouldRetry', () => {
  it('does not retry client errors', () => {
    expect(shouldRetry(0, new ApiError(404, 'Not found', 'Patients.NotFound'))).toBe(false)
    expect(shouldRetry(0, new ApiError(401, 'Session expired'))).toBe(false)
  })

  it('retries server errors at most twice', () => {
    const error = new ApiError(500, 'Server error')
    expect(shouldRetry(0, error)).toBe(true)
    expect(shouldRetry(1, error)).toBe(true)
    expect(shouldRetry(2, error)).toBe(false)
  })

  it('retries errors that are not ApiError', () => {
    expect(shouldRetry(0, new Error('Network down'))).toBe(true)
  })
})
