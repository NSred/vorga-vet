import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { login as loginRequest, register as registerRequest } from '@/features/auth/api/authApi'
import { decodeJwt, roleFromClaim } from '@/features/auth/lib/decodeJwt'
import { accessTokenStore } from '@/shared/lib/accessTokenStore'
import { tokenStorage } from '@/shared/lib/tokenStorage'
import { refreshAccessToken, setUnauthorizedHandler } from '@/shared/lib/apiClient'
import type { LoginRequest, RegisterRequest, UserRole } from '@/features/auth/types'

interface AuthUser {
  userId: string
  email: string
  role: UserRole
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
  return { userId: claims.sub, email: claims.email, role: roleFromClaim(claims.role) }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()

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

  const login = useCallback(
    async (request: LoginRequest) => {
      const tokens = await loginRequest(request)
      accessTokenStore.set(tokens.accessToken)
      tokenStorage.set(tokens.refreshToken)
      queryClient.clear()
      setUser(userFromAccessToken(tokens.accessToken))
    },
    [queryClient],
  )

  const register = useCallback(async (request: RegisterRequest) => {
    await registerRequest(request)
  }, [])

  const logout = useCallback(() => {
    accessTokenStore.set(null)
    tokenStorage.clear()
    queryClient.clear()
    setUser(null)
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
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
