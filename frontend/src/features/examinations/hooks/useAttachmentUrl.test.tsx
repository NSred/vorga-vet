import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryWrapper } from '@/test/renderWithQuery'
import * as examinationsApi from '../api/examinationsApi'
import { useAttachmentUrl } from './useAttachmentUrl'

const created: string[] = []
const revoked: string[] = []

beforeEach(() => {
  created.length = 0
  revoked.length = 0
  let counter = 0
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => {
      const url = `blob:mock-${++counter}`
      created.push(url)
      return url
    }),
    revokeObjectURL: vi.fn((url: string) => {
      revoked.push(url)
    }),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('useAttachmentUrl', () => {
  it('creates an object url for the fetched blob and revokes it on unmount', async () => {
    vi.spyOn(examinationsApi, 'getAttachmentBlob').mockResolvedValue(
      new Blob(['bytes'], { type: 'image/png' }),
    )

    const { result, unmount } = renderHook(() => useAttachmentUrl('att1'), {
      wrapper: QueryWrapper,
    })

    await waitFor(() => expect(result.current.url).toBe('blob:mock-1'))
    expect(created).toEqual(['blob:mock-1'])
    expect(revoked).toEqual([])

    unmount()

    expect(revoked).toEqual(['blob:mock-1'])
  })

  it('reports a failure instead of a url', async () => {
    vi.spyOn(examinationsApi, 'getAttachmentBlob').mockRejectedValue(new Error('gone'))

    const { result } = renderHook(() => useAttachmentUrl('att1'), { wrapper: QueryWrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.url).toBeNull()
    expect(created).toEqual([])
  })

  it('fetches nothing until an id is given', () => {
    const spy = vi.spyOn(examinationsApi, 'getAttachmentBlob')

    const { result } = renderHook(() => useAttachmentUrl(null), { wrapper: QueryWrapper })

    expect(spy).not.toHaveBeenCalled()
    expect(result.current.url).toBeNull()
  })
})
