import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Role } from '@prescriptions/shared';
import { setAccessToken, removeAccessToken } from '@/lib/api-client';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isHydrated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isHydrated: false,

      setAuth: (user, accessToken) => {
        setAccessToken(accessToken);
        set({ user, accessToken });
      },

      clearAuth: () => {
        removeAccessToken();
        set({ user: null, accessToken: null });
      },

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'auth-store',
      // Solo persistir user, no el token (el token vive en cookie)
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
