import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';
export const useAuthStore = create()(persist((set) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    login: async (email, password) => {
        const response = await api.post('/api/auth/login', { email, password });
        const { accessToken, refreshToken, user } = response.data.data;
        set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true
        });
    },
    logout: () => {
        set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false
        });
    },
    setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
    }
}), {
    name: 'dflow-auth',
    partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated
    })
}));
