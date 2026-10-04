import { describe, expect, it } from 'vitest'
import { parseFilterParams, toFilterParams } from './patientFilterParams'

function parse(query: string) {
  return parseFilterParams(new URLSearchParams(query))
}

describe('parseFilterParams', () => {
  it('defaults an empty query to active, page 1, ten rows', () => {
    const parsed = parse('')

    expect(parsed.filters).toEqual({ status: 'active' })
    expect(parsed.allergenName).toBeUndefined()
    expect(parsed.page).toBe(1)
    expect(parsed.pageSize).toBe(10)
  })

  it('reads every filter', () => {
    const parsed = parse(
      'search=rex&species=dog&sex=female&allergen=Pollen&city=Novi%20Sad&status=all&page=3&pageSize=20',
    )

    expect(parsed.filters).toEqual({
      search: 'rex',
      species: 'dog',
      sex: 'female',
      city: 'Novi Sad',
      status: 'all',
    })
    expect(parsed.allergenName).toBe('Pollen')
    expect(parsed.page).toBe(3)
    expect(parsed.pageSize).toBe(20)
  })

  it('falls back to defaults for unrecognised values instead of throwing', () => {
    const parsed = parse('species=dinosaur&sex=unknown&status=archived&page=abc&pageSize=999')

    expect(parsed.filters).toEqual({ status: 'active' })
    expect(parsed.page).toBe(1)
    expect(parsed.pageSize).toBe(10)
  })

  it('ignores a blank search term', () => {
    expect(parse('search=%20%20').filters).toEqual({ status: 'active' })
  })
})

describe('toFilterParams', () => {
  it('omits everything at its default', () => {
    const params = toFilterParams({ status: 'active' }, 1, 10)

    expect(params.toString()).toBe('')
  })

  it('writes the allergen by name', () => {
    const params = toFilterParams(
      { status: 'active', allergen: { id: 'a1', name: 'Pollen' } },
      1,
      10,
    )

    expect(params.get('allergen')).toBe('Pollen')
    expect(params.has('allergenId')).toBe(false)
  })

  it('round-trips a fully populated filter set', () => {
    const filters = {
      search: 'rex',
      species: 'dog',
      sex: 'female',
      city: 'Novi Sad',
      status: 'deleted',
    } as const

    const parsed = parseFilterParams(toFilterParams({ ...filters }, 3, 50))

    expect(parsed.filters).toEqual(filters)
    expect(parsed.page).toBe(3)
    expect(parsed.pageSize).toBe(50)
  })
})
