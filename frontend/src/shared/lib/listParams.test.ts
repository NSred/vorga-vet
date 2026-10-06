import { describe, expect, it } from 'vitest'
import { oneOf, parsePagedParams, positiveInt, writePagedParams } from './listParams'

const SPEC = {
  statuses: ['active', 'all', 'retired'] as const,
  defaultStatus: 'active' as const,
  pageSizes: [25, 50],
  defaultPageSize: 25,
}

describe('oneOf and positiveInt', () => {
  it('accepts only listed values and positive integers', () => {
    expect(oneOf('b', ['a', 'b'])).toBe('b')
    expect(oneOf('c', ['a', 'b'])).toBeUndefined()
    expect(oneOf(null, ['a'])).toBeUndefined()
    expect(positiveInt('3', 1)).toBe(3)
    expect(positiveInt('0', 1)).toBe(1)
    expect(positiveInt('2.5', 1)).toBe(1)
    expect(positiveInt(null, 7)).toBe(7)
  })
})

describe('paged params', () => {
  it('reads defaults and rejects a page size that is not offered', () => {
    expect(parsePagedParams(new URLSearchParams('pageSize=30&search=%20'), SPEC)).toEqual({
      filters: { status: 'active' },
      page: 1,
      pageSize: 25,
    })
  })

  it('keeps foreign keys, replaces its own and writes extras between search and status', () => {
    const base = new URLSearchParams('tab=breeds&status=retired&page=4&species=cat')

    const params = writePagedParams(
      base,
      { filters: { search: 'rex', status: 'all' }, page: 2, pageSize: 50 },
      SPEC,
      { species: 'dog', city: undefined },
    )

    expect(params.toString()).toBe(
      'tab=breeds&search=rex&species=dog&status=all&page=2&pageSize=50',
    )
    expect(base.toString()).toBe('tab=breeds&status=retired&page=4&species=cat')
  })
})
