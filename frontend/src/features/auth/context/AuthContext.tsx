import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { login as loginRequest, register as registerRequest } from '@/features/auth/api/authApi'
import { decodeJwt } from '@/features/auth/lib/decodeJwt'
import { accessTokenStore } from '@/shared/lib/accessTokenStore'
import { tokenStorage } from '@/shared/lib/tokenStorage'
import { refreshAccessToken, setUnauthorizedHandler } from '@/shared/lib/apiClient'
import type { LoginRequest, RegisterRequest } from '@/features/auth/types'

interface AuthUser {
  userId: string
  email: string
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (request: LoginRequest) => Promise<void>
  register: (request: RegisterRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function userFromAccessToken(accessToken: string): AuthUser {
  const claims = decodeJwt(accessToken)
  return { userId: claims.sub, email: claims.email }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))

    let cancelled = false

    async function bootstrap() {
      const refreshed = await refreshAccessToken()
      if (cancelled) return
      if (refreshed) {
        const accessToken = accessTokenStore.get()
        if (accessToken) {
          setUser(userFromAccessToken(accessToken))
        }
      }
      setIsLoading(false)
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [])

  const login = async (request: LoginRequest) => {
    const tokens = await loginRequest(request)
    accessTokenStore.set(tokens.accessToken)
    tokenStorage.set(tokens.refreshToken)
    setUser(userFromAccessToken(tokens.accessToken))
  }

  const register = async (request: RegisterRequest) => {
    await registerRequest(request)
  }

  const logout = () => {
    accessTokenStore.set(null)
    tokenStorage.clear()
    setUser(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isLoading, login, register, logout }),
    [user, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
