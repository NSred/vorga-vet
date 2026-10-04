const REFRESH_TOKEN_KEY = 'vorgavet.refreshToken'

export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },
  set(refreshToken: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },
  clear(): void {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}
