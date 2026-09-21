import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiFetch, apiFetchBlob, isApiErrorCode } from './apiClient'
import { accessTokenStore } from './accessTokenStore'
import { tokenStorage } from './tokenStorage'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('apiFetch error parsing', () => {
  it('exposes the problem code so callers can branch on it', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(409, {
        title: 'Patients.CardNumberNotUnique',
        detail: 'A patient with this card number already exists',
      }),
    )

    const error = await apiFetch('/patients', { method: 'POST' }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(409)
    expect((error as ApiError).code).toBe('Patients.CardNumberNotUnique')
    expect((error as ApiError).message).toBe('A patient with this card number already exists')
  })

  it('collects validation descriptions from the errors extension', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(400, {
        title: 'Validation.General',
        detail: 'One or more validation errors occurred',
        errors: [
          { code: 'NotEmptyValidator', description: "'Name' must not be empty." },
          { code: 'MaximumLengthValidator', description: "'Card Number' is too long." },
        ],
      }),
    )

    const error = (await apiFetch('/patients', { method: 'POST' }).catch(
      (e: unknown) => e,
    )) as ApiError

    expect(error.validationMessages).toEqual([
      "'Name' must not be empty.",
      "'Card Number' is too long.",
    ])
  })

  it('falls back to status text when the body is not JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('boom', { status: 500, statusText: 'Internal Server Error' }),
    )

    const error = (await apiFetch('/patients').catch((e: unknown) => e)) as ApiError

    expect(error.status).toBe(500)
    expect(error.code).toBeUndefined()
    expect(error.validationMessages).toBeUndefined()
  })

  it('explains a forbidden response that has no body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 403 }))

    const error = (await apiFetch('/owners').catch((e: unknown) => e)) as ApiError

    expect(error.status).toBe(403)
    expect(error.message).toBe("You don't have permission to do that.")
  })
})

describe('isApiErrorCode', () => {
  it('matches one of the given codes', () => {
    const error = new ApiError(409, 'taken', 'Appointments.SlotTaken')

    expect(isApiErrorCode(error, 'Appointments.SlotTaken')).toBe(true)
    expect(isApiErrorCode(error, 'Appointments.NotFound', 'Appointments.SlotTaken')).toBe(true)
  })

  it('rejects other codes, missing codes and non-api errors', () => {
    expect(
      isApiErrorCode(new ApiError(404, 'x', 'Appointments.NotFound'), 'Appointments.SlotTaken'),
    ).toBe(false)
    expect(isApiErrorCode(new ApiError(500, 'x'), 'Appointments.SlotTaken')).toBe(false)
    expect(isApiErrorCode(new Error('x'), 'Appointments.SlotTaken')).toBe(false)
  })
})

describe('apiFetch with FormData', () => {
  it('lets the browser set the multipart content type', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse(200, 'attachment-id'))
    const body = new FormData()
    body.append('kind', '0')

    await apiFetch('/examinations/e1/attachments', { method: 'POST', body })

    const headers = (fetchSpy.mock.calls[0][1] as RequestInit).headers as Headers
    expect(headers.has('Content-Type')).toBe(false)
  })

  it('still sends the bearer token', async () => {
    accessTokenStore.set('token-1')
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(200, 'id'))

    await apiFetch('/examinations/e1/attachments', { method: 'POST', body: new FormData() })

    const headers = (fetchSpy.mock.calls[0][1] as RequestInit).headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer token-1')
    accessTokenStore.set(null)
  })
})

describe('apiFetchBlob', () => {
  it('returns the response body as a blob', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('image-bytes', { status: 200, headers: { 'Content-Type': 'image/png' } }),
    )

    const blob = await apiFetchBlob('/attachments/att1')

    expect(blob.type).toBe('image/png')
    expect(blob.size).toBe('image-bytes'.length)
  })

  it('refreshes once on 401 and retries', async () => {
    tokenStorage.set('refresh-1')
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        jsonResponse(200, { accessToken: 'new-access', refreshToken: 'new-refresh' }),
      )
      .mockResolvedValueOnce(new Response('bytes', { status: 200 }))

    const blob = await apiFetchBlob('/attachments/att1')

    expect(blob.size).toBe('bytes'.length)
    expect(fetchSpy).toHaveBeenCalledTimes(3)
    tokenStorage.clear()
    accessTokenStore.set(null)
  })

  it('throws an ApiError when the image is gone', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(404, { title: 'Attachments.ContentMissing', detail: 'file is missing' }),
    )

    const error = (await apiFetchBlob('/attachments/att1').catch((e: unknown) => e)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('Attachments.ContentMissing')
  })
})
