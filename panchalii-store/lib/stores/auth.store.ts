'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  role: 'customer' | 'admin';
  loyaltyPoints: number;
  walletBalance: number;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, tokens: { access: { token: string }; refresh: { token: string } }) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, tokens) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('panchalii_access_token', tokens.access.token);
          localStorage.setItem('panchalii_refresh_token', tokens.refresh.token);
        }
        set({ user, accessToken: tokens.access.token, refreshToken: tokens.refresh.token, isAuthenticated: true });
      },

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('panchalii_access_token');
          localStorage.removeItem('panchalii_refresh_token');
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      updateUser: (updates) =>
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
    }),
    { name: 'panchalii-auth', partialize: (s: AuthState) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) }
  )
);
