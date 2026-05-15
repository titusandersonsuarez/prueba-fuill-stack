'use client';

import { useState, useEffect, useCallback } from 'react';
import { PatientsTable } from '@/components/patients/patients-table';
import { Input } from '@/components/ui/input';
import { PageSpinner } from '@/components/ui/spinner';
import { RoleGuard } from '@/components/auth/role-guard';
import { patientsService } from '@/services/patients.service';
import { ApiError } from '@/lib/api-client';
import type { Patient, PaginationMeta } from '@/types';
import { Role } from '@prescriptions/shared';

function PatientsContent() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
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
      const res = await patientsService.list(page, 20, { search: search || undefined });
      setPatients(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : 'Error cargando pacientes');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-700">
            Filtros {search && <span className="text-slate-400">(1 activo)</span>}
          </h2>
          {search && (
            <button
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setPage(1);
              }}
              className="text-xs text-primary-600 hover:underline font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Input
            label="Buscar"
            placeholder="Nombre, apellido o email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <PageSpinner />
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : (
        <PatientsTable patients={patients} meta={meta} page={page} onPageChange={setPage} />
      )}
    </div>
  );
}

export default function PatientsPage() {
  return (
    <RoleGuard roles={[Role.ADMIN, Role.DOCTOR]}>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pacientes</h1>
          <p className="text-sm text-slate-500 mt-0.5">Listado de pacientes registrados</p>
        </div>
        <PatientsContent />
      </div>
    </RoleGuard>
  );
}
