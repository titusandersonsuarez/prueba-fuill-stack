import type { Metadata } from 'next';
import Link from 'next/link';
import { CreateUserForm } from '@/components/users/create-user-form';
import { RoleGuard } from '@/components/auth/role-guard';
import { Role } from '@prescriptions/shared';

export const metadata: Metadata = { title: 'Nuevo usuario — Prescriptions App' };

export default function NewUserPage() {
  return (
    <RoleGuard roles={[Role.ADMIN]}>
      <div className="space-y-5">
        <div>
          <nav className="text-xs text-slate-400 mb-1">
            <Link href="/dashboard/users" className="hover:text-slate-600">
              Usuarios
            </Link>{' '}
            / Nuevo
          </nav>
          <h1 className="text-xl font-bold text-slate-900">Nuevo usuario</h1>
        </div>
        <CreateUserForm />
      </div>
    </RoleGuard>
  );
}
