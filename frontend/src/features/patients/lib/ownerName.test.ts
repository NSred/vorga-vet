import { describe, expect, it } from 'vitest'
import { splitOwnerName } from './ownerName'

describe('splitOwnerName', () => {
  it('splits a two-part name', () => {
    expect(splitOwnerName('Marko Marković')).toEqual({
      firstName: 'Marko',
      lastName: 'Marković',
    })
  })

  it('treats a single word as the first name', () => {
    expect(splitOwnerName('Marko')).toEqual({ firstName: 'Marko', lastName: '' })
  })

  it('puts everything after the first space into the last name, which is lossy', () => {
    expect(splitOwnerName('Ana Marija Petrović')).toEqual({
      firstName: 'Ana',
      lastName: 'Marija Petrović',
    })
  })

  it('tolerates surrounding whitespace', () => {
    expect(splitOwnerName('  Marko Marković  ')).toEqual({
      firstName: 'Marko',
      lastName: 'Marković',
    })
  })
})
