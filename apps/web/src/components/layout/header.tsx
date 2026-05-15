'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { authService } from '@/services/auth.service';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  doctor: 'Médico',
  patient: 'Paciente',
};

export function Header() {
  const router = useRouter();
  const { user, clearAuth } = useAuth();

  async function handleLogout() {
    try {
      await authService.logout();
    } catch {
      // limpiar estado aunque el endpoint falle
    } finally {
      clearAuth();
      router.push('/login');
    }
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div />

      <div className="flex items-center gap-4">
        {user && (
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-800 leading-none">{user.email}</p>
            <p className="text-xs text-slate-400 mt-0.5">{ROLE_LABEL[user.role] ?? user.role}</p>
          </div>
        )}

        <button
          onClick={() => void handleLogout()}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition-colors font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Salir
        </button>
      </div>
    </header>
  );
}
