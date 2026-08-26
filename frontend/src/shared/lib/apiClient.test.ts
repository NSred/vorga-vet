import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiFetch } from './apiClient'

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
})
