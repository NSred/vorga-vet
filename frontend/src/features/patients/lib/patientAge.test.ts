import { afterEach, describe, expect, it, vi } from 'vitest'
import { birthDateForAge, formatAge, wholeYears } from './patientAge'

afterEach(() => {
  vi.useRealTimers()
})

function freezeAt(dateIso: string) {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(`${dateIso}T12:00:00`))
}

describe('formatAge', () => {
  it('returns undefined when there is no birth date', () => {
    expect(formatAge(undefined)).toBeUndefined()
  })

  it('returns undefined for a birth date in the future', () => {
    freezeAt('2026-10-09')

    expect(formatAge('2026-10-10')).toBeUndefined()
  })

  it('shows whole years on the birthday', () => {
    freezeAt('2026-08-27')

    expect(formatAge('2020-08-27')).toBe('6 yrs')
  })

  it('uses the singular for one year', () => {
    freezeAt('2026-08-27')

    expect(formatAge('2025-08-27')).toBe('1 yr')
  })

  it('adds the months past the last birthday', () => {
    freezeAt('2026-10-09')

    expect(formatAge('2023-08-01')).toBe('3 yrs 2 mo')
  })

  it('does not count a month whose day has not come yet', () => {
    freezeAt('2026-08-27')

    expect(formatAge('2020-08-28')).toBe('5 yrs 11 mo')
  })

  it('shows months alone under a year', () => {
    freezeAt('2026-10-09')

    expect(formatAge('2026-03-01')).toBe('7 mo')
  })

  it('shows weeks under a month', () => {
    freezeAt('2026-10-09')

    expect(formatAge('2026-09-20')).toBe('2 wk')
  })

  it('shows less than a week for a newborn', () => {
    freezeAt('2026-10-09')

    expect(formatAge('2026-10-09')).toBe('< 1 wk')
  })

  it('counts weeks across a month boundary short of a full month', () => {
    freezeAt('2026-03-05')

    expect(formatAge('2026-02-10')).toBe('3 wk')
  })
})

describe('wholeYears', () => {
  it('returns undefined without a birth date or for a future one', () => {
    expect(wholeYears(undefined)).toBeUndefined()
    expect(wholeYears('2026-10-10', new Date(2026, 9, 9))).toBeUndefined()
  })

  it('counts only birthdays already reached', () => {
    const today = new Date(2026, 9, 9)

    expect(wholeYears('2023-10-09', today)).toBe(3)
    expect(wholeYears('2023-10-10', today)).toBe(2)
    expect(wholeYears('2026-03-01', today)).toBe(0)
  })
})

describe('birthDateForAge', () => {
  it('goes back the given number of whole years from today', () => {
    expect(birthDateForAge(3, new Date(2026, 9, 9))).toBe('2023-10-09')
    expect(birthDateForAge(0, new Date(2026, 9, 9))).toBe('2026-10-09')
  })

  it('falls back to 28 February from a leap day', () => {
    const leapDay = new Date(2028, 1, 29)

    expect(birthDateForAge(1, leapDay)).toBe('2027-02-28')
    expect(wholeYears(birthDateForAge(1, leapDay), leapDay)).toBe(1)
  })

  it('round-trips with wholeYears', () => {
    const today = new Date(2026, 9, 9)

    for (const years of [0, 1, 7, 15, 40]) {
      expect(wholeYears(birthDateForAge(years, today), today)).toBe(years)
    }
  })
})
