import { afterEach, describe, expect, it, vi } from 'vitest'
import { calculateAge } from './patientAge'

afterEach(() => {
  vi.useRealTimers()
})

function freezeAt(dateIso: string) {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(`${dateIso}T12:00:00`))
}

describe('calculateAge', () => {
  it('returns undefined when there is no birth date', () => {
    expect(calculateAge(undefined)).toBeUndefined()
  })

  it('counts whole years', () => {
    freezeAt('2026-08-27')

    expect(calculateAge('2020-08-27')).toBe(6)
  })

  it('does not count a birthday that has not happened yet this year', () => {
    freezeAt('2026-08-27')

    expect(calculateAge('2020-08-28')).toBe(5)
  })

  it('returns 0 for a patient born this year', () => {
    freezeAt('2026-08-27')

    expect(calculateAge('2026-01-04')).toBe(0)
  })
})
