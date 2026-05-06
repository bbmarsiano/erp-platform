import { create } from 'zustand'

type AuthUser = {
  id: string
  email: string
  role: string
  tenantId: string
}

type AuthState = {
  user: AuthUser | null
  accessToken: string | null
  refreshTokenValue: string | null
  isAuthenticated: boolean
  login: (payload: { accessToken: string; refreshToken: string; user?: AuthUser }) => void
  logout: () => void
  refreshToken: (token: string) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshTokenValue: null,
  isAuthenticated: false,
  login: ({ accessToken, refreshToken, user }) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)

    set({
      accessToken,
      refreshTokenValue: refreshToken,
      user: user ?? null,
      isAuthenticated: true
    })
  },
  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({
      user: null,
      accessToken: null,
      refreshTokenValue: null,
      isAuthenticated: false
    })
  },
  refreshToken: (token) => {
    localStorage.setItem('accessToken', token)
    set({ accessToken: token, isAuthenticated: true })
  }
}))
