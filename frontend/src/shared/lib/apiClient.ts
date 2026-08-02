import { env } from '@/shared/config/env'
import { accessTokenStore } from '@/shared/lib/accessTokenStore'
import { tokenStorage } from '@/shared/lib/tokenStorage'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

interface ProblemDetails {
  title?: string
  detail?: string
}

interface RefreshResponse {
  accessToken: string
  refreshToken: string
}

let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = tokenStorage.get()
  if (!refreshToken) return false

  const response = await fetch(`${env.apiBaseUrl}/users/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  if (!response.ok) return false

  const tokens = (await response.json()) as RefreshResponse
  accessTokenStore.set(tokens.accessToken)
  tokenStorage.set(tokens.refreshToken)
  return true
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const problem = (await response.json()) as ProblemDetails
    return problem.detail ?? problem.title ?? response.statusText
  } catch {
    return response.statusText
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const accessToken = accessTokenStore.get()
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, { ...options, headers })

  if (response.status === 401 && !isRetry) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return apiFetch<T>(path, options, true)
    }
    accessTokenStore.set(null)
    tokenStorage.clear()
    onUnauthorized?.()
    throw new ApiError(401, 'Session expired. Please log in again.')
  }

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorMessage(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
