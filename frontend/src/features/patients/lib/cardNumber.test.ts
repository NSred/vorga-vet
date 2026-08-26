import { afterEach, describe, expect, it, vi } from 'vitest'
import { generatePatientCardNumber } from './cardNumber'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('generatePatientCardNumber', () => {
  it('formats as species letter, two digit year, dash, five digits', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.04821)

    const result = generatePatientCardNumber('dog', new Date('2026-03-14T00:00:00Z'))

    expect(result).toBe('D26-04821')
  })

  it('uses the right letter for each species', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const now = new Date('2026-01-01T00:00:00Z')

    expect(generatePatientCardNumber('dog', now)).toBe('D26-00000')
    expect(generatePatientCardNumber('cat', now)).toBe('C26-00000')
    expect(generatePatientCardNumber('bird', now)).toBe('B26-00000')
    expect(generatePatientCardNumber('other', now)).toBe('O26-00000')
  })

  it('pads the random tail to five digits', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.000075)

    expect(generatePatientCardNumber('cat', new Date('2026-01-01T00:00:00Z'))).toBe('C26-00007')
  })

  it('stays within the backend 20 character limit', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99999)

    expect(generatePatientCardNumber('other').length).toBeLessThanOrEqual(20)
  })
})
