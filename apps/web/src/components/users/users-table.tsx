'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { ApiError } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { usersService, type AdminUser } from '@/services/users.service';
import type { PaginationMeta } from '@/types';

const ROLE_VARIANT: Record<string, 'info' | 'success' | 'warning'> = {
  admin: 'danger' as 'warning',
  doctor: 'info',
  patient: 'success',
};

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  doctor: 'Médico',
  patient: 'Paciente',
};

interface UsersTableProps {
  users: AdminUser[];
  meta: PaginationMeta;
  page: number;
  onPageChange: (p: number) => void;
  onDeleted: (id: string) => void;
}

export function UsersTable({ users, meta, page, onPageChange, onDeleted }: UsersTableProps) {
  async function handleDelete(user: AdminUser) {
    if (!confirm(`¿Eliminar usuario ${user.email}? Esta acción también eliminará su perfil.`))
      return;
    try {
      await usersService.remove(user.id);
      onDeleted(user.id);
    } catch (err) {
      alert(err instanceof ApiError ? err.body.message : 'Error al eliminar');
    }
  }

  function getDisplayName(user: AdminUser): string {
    if (user.doctor) return `${user.doctor.firstName} ${user.doctor.lastName}`;
    if (user.patient) return `${user.patient.firstName} ${user.patient.lastName}`;
    return '—';
  }

  if (users.length === 0) {
    return (
      <EmptyState
        title="Sin usuarios"
        action={
          <Link href="/dashboard/users/new">
            <button className="text-sm text-primary-600 hover:underline font-medium">
              Crear usuario
            </button>
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 text-left font-medium text-slate-600">Email</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Rol</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Registro</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Acc.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={ROLE_VARIANT[u.role] ?? 'default'}>
                    {ROLE_LABEL[u.role] ?? u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-500">{getDisplayName(u)}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => void handleDelete(u)}
                    title="Eliminar usuario"
                    className="text-slate-400 hover:text-red-600 transition-colors p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={meta.totalPages}
        total={meta.total}
        limit={meta.limit}
        onPageChange={onPageChange}
      />
    </div>
  );
}
