'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Role } from '@prescriptions/shared';
import { useAuth } from '@/hooks/use-auth';

interface RoleGuardProps {
  children: React.ReactNode;
  roles: Role[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, roles, fallback = null }: RoleGuardProps) {
  const router = useRouter();
  const { user, isHydrated } = useAuth();

  const allowed = isHydrated && !!user && roles.includes(user.role);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!roles.includes(user.role)) {
      router.push('/dashboard/prescriptions');
    }
  }, [isHydrated, user, roles, router]);

  if (!isHydrated) return <>{fallback}</>;
  if (!allowed) return null;
  return <>{children}</>;
}
