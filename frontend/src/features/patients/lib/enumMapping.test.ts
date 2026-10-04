import { describe, expect, it } from 'vitest'
import { sexFromApi, sexToApi, speciesFromApi, speciesToApi } from './enumMapping'

describe('speciesToApi', () => {
  it('maps every species to its backend integer', () => {
    expect(speciesToApi('dog')).toBe(0)
    expect(speciesToApi('cat')).toBe(1)
    expect(speciesToApi('bird')).toBe(2)
    expect(speciesToApi('other')).toBe(3)
  })
})

describe('speciesFromApi', () => {
  it('maps backend integers back to species', () => {
    expect(speciesFromApi(0)).toBe('dog')
    expect(speciesFromApi(3)).toBe('other')
  })

  it('throws on an unknown value instead of returning undefined', () => {
    expect(() => speciesFromApi(99)).toThrow(/Unknown species/)
  })
})

describe('sex mapping', () => {
  it('maps both directions', () => {
    expect(sexToApi('male')).toBe(0)
    expect(sexToApi('female')).toBe(1)
    expect(sexFromApi(0)).toBe('male')
    expect(sexFromApi(1)).toBe('female')
  })

  it('throws on an unknown value', () => {
    expect(() => sexFromApi(7)).toThrow(/Unknown sex/)
  })
})
