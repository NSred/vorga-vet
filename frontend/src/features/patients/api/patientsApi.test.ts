import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildPatientsQuery, deletePatient, getPatient, getPatients, updatePatient } from './patientsApi'
import type { PatientDetailDto, PatientListItemDto } from '../types'

function mockFetch(body: unknown, status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    status === 204
      ? new Response(null, { status })
      : new Response(JSON.stringify(body), {
          status,
          headers: { 'Content-Type': 'application/json' },
        }),
  )
}

function requestedUrl(spy: ReturnType<typeof mockFetch>): string {
  return String(spy.mock.calls[0][0])
}

const listDto: PatientListItemDto = {
  id: 'p1',
  cardNumber: 'D26-04821',
  name: 'Rex',
  species: 0,
  breedName: 'Pug',
  sex: 0,
  birthDate: '2020-05-01T00:00:00',
  weightKg: 12.5,
  color: null,
  chipNumber: null,
  isDeleted: false,
  ownerName: 'Marko Marković',
  phoneNumber: '060/1234567',
  address: null,
  city: 'Novi Sad',
  allergies: [],
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('buildPatientsQuery', () => {
  it('sends only status, page and page size by default', () => {
    expect(buildPatientsQuery({ status: 'active' }, 1, 10).toString()).toBe(
      'status=0&page=1&pageSize=10',
    )
  })

  it('maps species, sex and status to their integers', () => {
    const query = buildPatientsQuery({ status: 'deleted', species: 'cat', sex: 'female' }, 1, 10)

    expect(query.get('species')).toBe('1')
    expect(query.get('sex')).toBe('1')
    expect(query.get('status')).toBe('2')
  })

  it('sends the allergen id, not its name', () => {
    const query = buildPatientsQuery(
      { status: 'active', allergen: { id: 'a1', name: 'Pollen' } },
      1,
      10,
    )

    expect(query.get('allergenId')).toBe('a1')
    expect(query.has('allergen')).toBe(false)
  })

  it('omits a blank search term and trims a real one', () => {
    expect(buildPatientsQuery({ status: 'active', search: '   ' }, 1, 10).has('search')).toBe(false)
    expect(buildPatientsQuery({ status: 'active', search: ' Rex ' }, 1, 10).get('search')).toBe('Rex')
  })
})

describe('getPatients', () => {
  it('requests the built query and maps the response', async () => {
    const spy = mockFetch({ items: [listDto], totalCount: 42, page: 1, pageSize: 10 })

    const page = await getPatients({ status: 'active' }, 1, 10)

    expect(requestedUrl(spy)).toContain('/patients?status=0&page=1&pageSize=10')
    expect(page.totalCount).toBe(42)
    expect(page.items[0].species).toBe('dog')
    expect(page.items[0].birthDate).toBe('2020-05-01')
  })
})

describe('getPatient', () => {
  it('maps a detail response', async () => {
    const detailDto: PatientDetailDto = {
      ...listDto,
      ownerId: 'o1',
      breedId: 'b1',
      anamnesis: null,
      note: null,
      createdAt: '2026-08-27T09:15:00',
      allergies: [{ id: 'a1', name: 'Pollen' }],
    }
    const spy = mockFetch(detailDto)

    const detail = await getPatient('p1')

    expect(requestedUrl(spy)).toMatch(/\/patients\/p1$/)
    expect(detail.ownerId).toBe('o1')
    expect(detail.allergies).toEqual([{ id: 'a1', name: 'Pollen' }])
  })
})

describe('updatePatient', () => {
  it('puts to the patient id and resolves on 204', async () => {
    const spy = mockFetch(null, 204)

    await expect(
      updatePatient('p1', {
        ownerId: 'o1',
        breedId: 'b1',
        cardNumber: 'D26-04821',
        name: 'Rex',
        sex: 0,
        allergenIds: [],
      }),
    ).resolves.toBeUndefined()

    expect(requestedUrl(spy)).toMatch(/\/patients\/p1$/)
    expect(spy.mock.calls[0][1]?.method).toBe('PUT')
  })
})

describe('deletePatient', () => {
  it('deletes the patient id and resolves on 204', async () => {
    const spy = mockFetch(null, 204)

    await expect(deletePatient('p1')).resolves.toBeUndefined()

    expect(spy.mock.calls[0][1]?.method).toBe('DELETE')
  })
})
