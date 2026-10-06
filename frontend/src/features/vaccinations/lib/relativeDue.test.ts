import { describe, expect, it } from 'vitest'
import { relativeDue } from './relativeDue'

const today = '2026-10-05'

describe('relativeDue', () => {
  it('names the nearest days', () => {
    expect(relativeDue('2026-10-05', today)).toBe('Today')
    expect(relativeDue('2026-10-06', today)).toBe('Tomorrow')
    expect(relativeDue('2026-10-04', today)).toBe('Yesterday')
  })

  it('counts days up to two months, then months', () => {
    expect(relativeDue('2026-10-08', today)).toBe('In 3 days')
    expect(relativeDue('2026-12-03', today)).toBe('In 59 days')
    expect(relativeDue('2026-12-04', today)).toBe('In 2 months')
    expect(relativeDue('2027-10-01', today)).toBe('In 12 months')
  })

  it('says how long a date is overdue', () => {
    expect(relativeDue('2026-09-30', today)).toBe('5 days overdue')
    expect(relativeDue('2026-06-05', today)).toBe('4 months overdue')
  })
})
