import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../lib/api'

interface AuthUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: string
  tenantId: string
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  allowedVersion: string | null
  licensedFeatures: string[]
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setTokens: (accessToken: string, refreshToken: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      allowedVersion: null,
      licensedFeatures: [],
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const response = await api.post('/api/auth/login', { email, password })
        const { accessToken, refreshToken, user, allowedVersion, licensedFeatures } =
          response.data.data
        set({
          user,
          accessToken,
          refreshToken,
          allowedVersion: allowedVersion ?? null,
          licensedFeatures: licensedFeatures ?? [],
          isAuthenticated: true
        })
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          allowedVersion: null,
          licensedFeatures: [],
          isAuthenticated: false
        })
      },

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken })
      }
    }),
    {
      name: 'dflow-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        allowedVersion: state.allowedVersion,
        licensedFeatures: state.licensedFeatures,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
