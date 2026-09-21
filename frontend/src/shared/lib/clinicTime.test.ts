import { describe, expect, it } from 'vitest'
import {
  addClinicDays,
  addClinicMonths,
  addClinicWeeks,
  clinicDateOf,
  clinicDayRange,
  clinicMonthGridRange,
  clinicRecentDaysRange,
  clinicTimeOf,
  clinicUpcomingDaysRange,
  clinicWeekRange,
} from './clinicTime'

describe('clinicDayRange', () => {
  it('spans clinic midnight to clinic midnight in summer time', () => {
    expect(clinicDayRange('2026-09-17')).toEqual({
      from: '2026-09-16T22:00:00.000Z',
      to: '2026-09-17T22:00:00.000Z',
    })
  })

  it('spans clinic midnight to clinic midnight in winter time', () => {
    expect(clinicDayRange('2026-01-15')).toEqual({
      from: '2026-01-14T23:00:00.000Z',
      to: '2026-01-15T23:00:00.000Z',
    })
  })

  it('covers 23 hours on the spring-forward day', () => {
    const { from, to } = clinicDayRange('2026-03-29')
    const hours = (Date.parse(to) - Date.parse(from)) / 3_600_000

    expect(hours).toBe(23)
  })

  it('covers 25 hours on the autumn day', () => {
    const { from, to } = clinicDayRange('2026-10-25')
    const hours = (Date.parse(to) - Date.parse(from)) / 3_600_000

    expect(hours).toBe(25)
  })
})

describe('clinicWeekRange', () => {
  it('starts on Monday and spans seven days', () => {
    const { from, to } = clinicWeekRange('2026-09-17')

    expect(from).toBe(clinicDayRange('2026-09-14').from)
    expect(to).toBe(clinicDayRange('2026-09-20').to)
  })
})

describe('clinicMonthGridRange', () => {
  it('covers the 42-day grid starting on a Monday', () => {
    const { from, to } = clinicMonthGridRange('2026-09-17')
    const days = (Date.parse(to) - Date.parse(from)) / 86_400_000

    expect(from).toBe(clinicDayRange('2026-08-31').from)
    expect(days).toBe(42)
  })
})

describe('clinicRecentDaysRange', () => {
  it('covers whole days ending with the given date', () => {
    const { from, to } = clinicRecentDaysRange(28, '2026-09-17')

    expect(from).toBe(clinicDayRange('2026-08-21').from)
    expect(to).toBe(clinicDayRange('2026-09-17').to)
  })
})

describe('clinicDateOf and clinicTimeOf', () => {
  it('resolves an instant to the clinic calendar day', () => {
    expect(clinicDateOf('2026-09-16T23:30:00Z')).toBe('2026-09-17')
    expect(clinicTimeOf('2026-09-16T23:30:00Z')).toBe('01:30')
  })

  it('formats a working hour in the clinic zone', () => {
    expect(clinicDateOf('2026-09-17T07:00:00Z')).toBe('2026-09-17')
    expect(clinicTimeOf('2026-09-17T07:00:00Z')).toBe('09:00')
  })
})

describe('clinic date arithmetic', () => {
  it('moves by days, weeks and months', () => {
    expect(addClinicDays('2026-09-17', 1)).toBe('2026-09-18')
    expect(addClinicDays('2026-03-28', 1)).toBe('2026-03-29')
    expect(addClinicWeeks('2026-09-17', -1)).toBe('2026-09-10')
    expect(addClinicMonths('2026-01-31', 1)).toBe('2026-02-28')
  })
})

describe('clinicUpcomingDaysRange', () => {
  it('starts on the given day and spans that many clinic days', () => {
    const { from, to } = clinicUpcomingDaysRange(62, '2026-09-17')

    expect(from).toBe(clinicDayRange('2026-09-17').from)
    expect(to).toBe(clinicDayRange('2026-11-17').to)
  })

  it('is the mirror of clinicRecentDaysRange', () => {
    expect(clinicUpcomingDaysRange(7, '2026-09-17')).toEqual(
      clinicRecentDaysRange(7, '2026-09-23'),
    )
  })
})
