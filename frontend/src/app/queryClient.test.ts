import { QueryObserver } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/lib/apiClient'
import { createQueryClient, shouldRetry } from './queryClient'

describe('shouldRetry', () => {
  it('does not retry client errors', () => {
    expect(shouldRetry(0, new ApiError(404, 'Not found', 'Patients.NotFound'))).toBe(false)
    expect(shouldRetry(0, new ApiError(401, 'Session expired'))).toBe(false)
  })

  it('retries server errors at most twice', () => {
    const error = new ApiError(500, 'Server error')
    expect(shouldRetry(0, error)).toBe(true)
    expect(shouldRetry(1, error)).toBe(true)
    expect(shouldRetry(2, error)).toBe(false)
  })

  it('retries errors that are not ApiError', () => {
    expect(shouldRetry(0, new Error('Network down'))).toBe(true)
  })
})

async function runFailingQuery(
  client: ReturnType<typeof createQueryClient>,
  meta?: { errorTitle: string },
) {
  const observer = new QueryObserver(client, {
    queryKey: ['boom', meta?.errorTitle ?? 'none'],
    queryFn: () => Promise.reject(new Error('boom')),
    retry: false,
    meta,
  })
  const unsubscribe = observer.subscribe(() => undefined)
  await vi.waitFor(() => expect(observer.getCurrentResult().isError).toBe(true))
  unsubscribe()
}

describe('createQueryClient', () => {
  it('reports a failed query once using its meta title', async () => {
    const onQueryError = vi.fn()
    const client = createQueryClient({ onQueryError, retry: false })

    await runFailingQuery(client, { errorTitle: 'Could not load things' })

    expect(onQueryError).toHaveBeenCalledTimes(1)
    expect(onQueryError).toHaveBeenCalledWith('Could not load things')
  })

  it('stays silent for a query without a title', async () => {
    const onQueryError = vi.fn()
    const client = createQueryClient({ onQueryError, retry: false })

    await runFailingQuery(client)

    expect(onQueryError).not.toHaveBeenCalled()
  })
})
