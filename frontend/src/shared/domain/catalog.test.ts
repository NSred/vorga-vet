import { describe, expect, it } from 'vitest'
import { toCatalogQuery } from './catalog'

describe('toCatalogQuery', () => {
  it('maps the status to its API number and keeps paging', () => {
    expect(toCatalogQuery({ status: 'retired' }, 3, 50)).toEqual({
      status: 2,
      page: 3,
      pageSize: 50,
    })
  })

  it('sends a trimmed search and drops a blank one', () => {
    expect(toCatalogQuery({ status: 'all', search: '  rabi ' }, 1, 25)).toEqual({
      status: 1,
      search: 'rabi',
      page: 1,
      pageSize: 25,
    })
    expect(toCatalogQuery({ status: 'active', search: '   ' }, 1, 25)).not.toHaveProperty('search')
  })
})
