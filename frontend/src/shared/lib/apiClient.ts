import { env } from '@/shared/config/env'
import { accessTokenStore } from '@/shared/lib/accessTokenStore'
import { tokenStorage } from '@/shared/lib/tokenStorage'

export class ApiError extends Error {
  status: number
  code?: string
  validationMessages?: string[]

  constructor(status: number, message: string, code?: string, validationMessages?: string[]) {
    super(message)
    this.status = status
    this.code = code
    this.validationMessages = validationMessages
  }
}

interface ProblemEntry {
  code?: string
  description?: string
}

interface ProblemDetails {
  title?: string
  detail?: string
  errors?: ProblemEntry[]
}

interface RefreshResponse {
  accessToken: string
  refreshToken: string
}

let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

let inFlightRefresh: Promise<boolean> | null = null

export function refreshAccessToken(): Promise<boolean> {
  inFlightRefresh ??= performRefresh().finally(() => {
    inFlightRefresh = null
  })
  return inFlightRefresh
}

async function performRefresh(): Promise<boolean> {
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

async function parseProblem(response: Response): Promise<ApiError> {
  try {
    const problem = (await response.json()) as ProblemDetails
    const messages = problem.errors
      ?.map((entry) => entry.description)
      .filter((description): description is string => Boolean(description))

    return new ApiError(
      response.status,
      problem.detail ?? problem.title ?? response.statusText,
      problem.title,
      messages && messages.length > 0 ? messages : undefined,
    )
  } catch {
    return new ApiError(response.status, response.statusText)
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
    throw await parseProblem(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
