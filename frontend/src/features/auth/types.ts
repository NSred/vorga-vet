export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  firstName: string
  lastName: string
  password: string
}

export interface AccessTokens {
  accessToken: string
  refreshToken: string
}
