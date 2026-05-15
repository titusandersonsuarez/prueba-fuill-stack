'use client';

import { useState, useEffect, useCallback } from 'react';
import { DoctorsTable } from '@/components/doctors/doctors-table';
import { Input } from '@/components/ui/input';
import { PageSpinner } from '@/components/ui/spinner';
import { RoleGuard } from '@/components/auth/role-guard';
import { doctorsService } from '@/services/doctors.service';
import { ApiError } from '@/lib/api-client';
import type { Doctor, PaginationMeta } from '@/types';
import { Role } from '@prescriptions/shared';

function DoctorsContent() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [specialityInput, setSpecialityInput] = useState('');
  const [speciality, setSpeciality] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Debounce búsqueda y especialidad (300ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setSpeciality(specialityInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, specialityInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await doctorsService.list(page, 20, {
        search: search || undefined,
        speciality: speciality || undefined,
      });
      setDoctors(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : 'Error cargando médicos');
    } finally {
      setLoading(false);
    }
  }, [page, search, speciality]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeFiltersCount = (search ? 1 : 0) + (speciality ? 1 : 0);

  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setSpecialityInput('');
    setSpeciality('');
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
            placeholder="Nombre, apellido, email o licencia…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Input
            label="Especialidad"
            placeholder="Cardiología…"
            value={specialityInput}
            onChange={(e) => setSpecialityInput(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <PageSpinner />
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : (
        <DoctorsTable doctors={doctors} meta={meta} page={page} onPageChange={setPage} />
      )}
    </div>
  );
}

export default function DoctorsPage() {
  return (
    <RoleGuard roles={[Role.ADMIN]}>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Médicos</h1>
          <p className="text-sm text-slate-500 mt-0.5">Listado de médicos registrados</p>
        </div>
        <DoctorsContent />
      </div>
    </RoleGuard>
  );
}
