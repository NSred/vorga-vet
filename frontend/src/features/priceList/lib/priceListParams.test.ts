import { describe, expect, it } from 'vitest'
import { parsePriceListParams, toPriceListParams } from './priceListParams'

describe('price list URL params', () => {
  it('defaults to active services, first page of 25', () => {
    expect(parsePriceListParams(new URLSearchParams())).toEqual({
      kind: 'service',
      filters: { status: 'active' },
      page: 1,
      pageSize: 25,
    })
  })

  it('reads a full view and ignores invalid values', () => {
    expect(
      parsePriceListParams(
        new URLSearchParams('kind=medication&search=%20rabi%20&status=retired&page=2&pageSize=50'),
      ),
    ).toEqual({
      kind: 'medication',
      filters: { search: 'rabi', status: 'retired' },
      page: 2,
      pageSize: 50,
    })

    expect(
      parsePriceListParams(new URLSearchParams('kind=drug&status=gone&page=-1&pageSize=7')),
    ).toEqual({ kind: 'service', filters: { status: 'active' }, page: 1, pageSize: 25 })
  })

  it('writes only what differs from the defaults and reads it back', () => {
    const view = {
      kind: 'medication' as const,
      filters: { search: 'vanguard', status: 'all' as const },
      page: 3,
      pageSize: 100,
    }

    const params = toPriceListParams(view)
    expect(params.toString()).toBe('kind=medication&search=vanguard&status=all&page=3&pageSize=100')
    expect(parsePriceListParams(params)).toEqual(view)
    expect(
      toPriceListParams({
        kind: 'service',
        filters: { status: 'active' },
        page: 1,
        pageSize: 25,
      }).toString(),
    ).toBe('')
  })
})
