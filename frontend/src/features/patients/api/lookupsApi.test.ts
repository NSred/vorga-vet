import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAllergen, searchAllergens } from './allergensApi'
import { createBreed, searchBreeds } from './breedsApi'
import { createOwner, ownerLabel, searchOwners } from './ownersApi'

function mockFetch(body: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

function requestedUrl(spy: ReturnType<typeof mockFetch>): string {
  return String(spy.mock.calls[0][0])
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('searchOwners', () => {
  it('omits the search param when the term is blank', async () => {
    const spy = mockFetch([])

    await searchOwners('   ')

    expect(requestedUrl(spy)).toMatch(/\/owners$/)
  })

  it('encodes the trimmed search term', async () => {
    const spy = mockFetch([])

    await searchOwners('  Subić ')

    expect(requestedUrl(spy)).toContain('search=Subi%C4%87')
  })
})

describe('ownerLabel', () => {
  it('renders last name first, matching the table', () => {
    expect(
      ownerLabel({ id: '1', firstName: 'Vladimir', lastName: 'Subić', phoneNumber: '060' }),
    ).toBe('Subić Vladimir')
  })
})

describe('searchBreeds', () => {
  it('always sends the species integer, which the endpoint requires', async () => {
    const spy = mockFetch([])

    await searchBreeds('cat', '')

    expect(requestedUrl(spy)).toContain('species=1')
  })

  it('adds the search term when present', async () => {
    const spy = mockFetch([])

    await searchBreeds('dog', 'Bichon')

    const url = requestedUrl(spy)
    expect(url).toContain('species=0')
    expect(url).toContain('search=Bichon')
  })
})

describe('createBreed', () => {
  it('converts species to its integer before sending', async () => {
    const spy = mockFetch('new-id')

    await createBreed({ name: 'Chartreux', species: 'cat' })

    const body = JSON.parse(String(spy.mock.calls[0][1]?.body)) as Record<string, unknown>
    expect(body).toEqual({ name: 'Chartreux', species: 1 })
  })
})

describe('createOwner', () => {
  it('posts the owner payload unchanged', async () => {
    const spy = mockFetch('new-id')

    await createOwner({
      firstName: 'Vladimir',
      lastName: 'Subić',
      phoneNumber: '060/7301103',
      address: 'Toplice Milana 20',
      city: 'Novi Sad',
    })

    const body = JSON.parse(String(spy.mock.calls[0][1]?.body)) as Record<string, unknown>
    expect(body.firstName).toBe('Vladimir')
    expect(body.city).toBe('Novi Sad')
  })
})

describe('allergens', () => {
  it('searches and creates', async () => {
    const searchSpy = mockFetch([{ id: '1', name: 'pollen' }])
    const results = await searchAllergens('pol')
    expect(results).toEqual([{ id: '1', name: 'pollen' }])
    expect(requestedUrl(searchSpy)).toContain('search=pol')

    vi.restoreAllMocks()

    const createSpy = mockFetch('allergen-id')
    await createAllergen({ name: 'pollen' })
    const body = JSON.parse(String(createSpy.mock.calls[0][1]?.body)) as Record<string, unknown>
    expect(body).toEqual({ name: 'pollen' })
  })
})
