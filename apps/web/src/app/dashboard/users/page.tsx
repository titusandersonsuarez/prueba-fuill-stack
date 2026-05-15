'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { UsersTable } from '@/components/users/users-table';
import { RoleGuard } from '@/components/auth/role-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PageSpinner } from '@/components/ui/spinner';
import { usersService, type AdminUser } from '@/services/users.service';
import { ApiError } from '@/lib/api-client';
import type { PaginationMeta } from '@/types';
import { Role } from '@prescriptions/shared';

function UsersContent() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Debounce búsqueda (300ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await usersService.list(page, 20, {
        search: search || undefined,
        role: role || undefined,
      });
      setUsers(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : 'Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  }, [page, search, role]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeFiltersCount = (search ? 1 : 0) + (role ? 1 : 0);

  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setRole('');
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-700">
            Filtros{' '}
            {activeFiltersCount > 0 && (
              <span className="text-slate-400">
                ({activeFiltersCount} activo{activeFiltersCount !== 1 ? 's' : ''})
              </span>
            )}
          </h2>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-primary-600 hover:underline font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Input
            label="Buscar"
            placeholder="Email o nombre…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Select
            label="Rol"
            value={role}
            onChange={(e) => {
              setRole(e.target.value as Role | '');
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            <option value={Role.ADMIN}>Admin</option>
            <option value={Role.DOCTOR}>Médico</option>
            <option value={Role.PATIENT}>Paciente</option>
          </Select>
        </div>
      </div>

      {loading ? (
        <PageSpinner />
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : (
        <UsersTable
          users={users}
          meta={meta}
          page={page}
          onPageChange={setPage}
          onDeleted={(id) => setUsers((prev) => prev.filter((u) => u.id !== id))}
        />
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <RoleGuard roles={[Role.ADMIN]}>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Usuarios</h1>
            <p className="text-sm text-slate-500 mt-0.5">Gestión de cuentas del sistema</p>
          </div>
          <Link href="/dashboard/users/new">
            <Button size="sm">+ Nuevo usuario</Button>
          </Link>
        </div>
        <UsersContent />
      </div>
    </RoleGuard>
  );
}
