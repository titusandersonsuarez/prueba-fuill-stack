'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { getAccessToken, setAccessToken } from '@/lib/api-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function Providers({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useEffect(() => {
    async function syncAuth() {
      const token = getAccessToken();

      if (user && !token) {
        // Access token expiró — intentar refresh silencioso antes de desloguear
        try {
          const res = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          });
          if (res.ok) {
            const data = (await res.json()) as { accessToken: string };
            setAccessToken(data.accessToken);
            // Re-sync user por si cambió (opcional — mismo user en este flujo)
            setAuth(user, data.accessToken);
          } else {
            clearAuth();
          }
        } catch {
          clearAuth();
        }
      }

      setHydrated();
    }

    void syncAuth();
    // Solo al montar: sincroniza la sesión una vez al cargar la app.
  }, []);

  return <>{children}</>;
}
