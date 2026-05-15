'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Role } from '@prescriptions/shared';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
}

const ClipboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
    />
  </svg>
);
const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);
const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);
const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);
const StethoscopeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard/prescriptions',
    label: 'Recetas',
    icon: <ClipboardIcon />,
    roles: [Role.ADMIN, Role.DOCTOR, Role.PATIENT],
  },
  {
    href: '/dashboard/patients',
    label: 'Pacientes',
    icon: <UserIcon />,
    roles: [Role.ADMIN, Role.DOCTOR],
  },
  {
    href: '/dashboard/doctors',
    label: 'Médicos',
    icon: <StethoscopeIcon />,
    roles: [Role.ADMIN],
  },
  {
    href: '/dashboard/users',
    label: 'Usuarios',
    icon: <UsersIcon />,
    roles: [Role.ADMIN],
  },
  {
    href: '/dashboard/metrics',
    label: 'Métricas',
    icon: <ChartIcon />,
    roles: [Role.ADMIN],
  },
  {
    href: '/dashboard/profile',
    label: 'Mi perfil',
    icon: <UserIcon />,
    roles: [Role.PATIENT, Role.DOCTOR],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const visibleItems = NAV_ITEMS.filter((item) => !user || item.roles.includes(user.role));

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-30 bg-slate-900/50 transition-opacity sm:hidden',
          open ? 'opacity-100 visible' : 'opacity-0 invisible',
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-200 sm:relative sm:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <ClipboardIcon />
          </div>
          <span className="font-semibold text-slate-800 text-sm">Prescriptions</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )}
              >
                <span className={cn(isActive ? 'text-primary-600' : 'text-slate-400')}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {user && (
          <div className="px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            <p className="text-xs font-medium text-slate-700 capitalize">{user.role}</p>
          </div>
        )}
      </aside>
    </>
  );
}
