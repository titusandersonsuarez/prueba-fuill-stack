'use client';

import { Role } from '@prescriptions/shared';
import { useAuthStore } from '@/store/auth.store';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setAuth = useAuthStore((s) => s.setAuth);

  return {
    user,
    isHydrated,
    isAuthenticated: !!user,
    isAdmin: user?.role === Role.ADMIN,
    isDoctor: user?.role === Role.DOCTOR,
    isPatient: user?.role === Role.PATIENT,
    clearAuth,
    setAuth,
  };
}
