'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PrescriptionsTable } from '@/components/prescriptions/prescriptions-table';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageSpinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { prescriptionsService } from '@/services/prescriptions.service';
import { doctorsService } from '@/services/doctors.service';
import { patientsService } from '@/services/patients.service';
import { ApiError } from '@/lib/api-client';
import type { Prescription, PaginationMeta, Doctor, Patient } from '@/types';
import { PrescriptionStatus, Role } from '@prescriptions/shared';

function PrescriptionsPageInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const initialPatientId = searchParams.get('patientId') ?? '';

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [page, setPage] = useState(1);

  const [status, setStatus] = useState<PrescriptionStatus | ''>('');
  const [patientId, setPatientId] = useState(initialPatientId);
  const [authorId, setAuthorId] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [code, setCode] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar opciones para los selectores (médico / paciente)
  useEffect(() => {
    if (!user) return;
    if (user.role === Role.ADMIN) {
      void doctorsService
        .list(1, 100)
        .then((res) => setDoctors(res.data))
        .catch(() => {});
    }
    if (user.role === Role.ADMIN || user.role === Role.DOCTOR) {
      void patientsService
        .list(1, 100)
        .then((res) => setPatients(res.data))
        .catch(() => {});
    }
  }, [user]);

  // Debounce búsqueda por código (300ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setCode(codeInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [codeInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await prescriptionsService.list({
        page,
        limit: 20,
        status: status || undefined,
        patientId: patientId || undefined,
        authorId: authorId || undefined,
        code: code || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setPrescriptions(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : 'Error cargando recetas');
    } finally {
      setLoading(false);
    }
  }, [page, status, patientId, authorId, code, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === patientId),
    [patients, patientId],
  );

  const activeFiltersCount =
    (status ? 1 : 0) +
    (patientId ? 1 : 0) +
    (authorId ? 1 : 0) +
    (code ? 1 : 0) +
    (from ? 1 : 0) +
    (to ? 1 : 0);

  function clearFilters() {
    setStatus('');
    setPatientId('');
    setAuthorId('');
    setCodeInput('');
    setCode('');
    setFrom('');
    setTo('');
    setPage(1);
  }

  if (!user) return null;

  const isAdmin = user.role === Role.ADMIN;
  const isDoctor = user.role === Role.DOCTOR;
  const canFilterByPatient = isAdmin || isDoctor;

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Recetas médicas</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {meta.total} receta{meta.total !== 1 ? 's' : ''}
            {selectedPatient && ` de ${selectedPatient.firstName} ${selectedPatient.lastName}`}
          </p>
        </div>
        {isDoctor && (
          <Link href="/dashboard/prescriptions/new">
            <Button size="sm">+ Nueva receta</Button>
          </Link>
        )}
      </div>

      {/* Filtros */}
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
            label="Código"
            placeholder="PRESC-..."
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
          />

          <Select
            label="Estado"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as PrescriptionStatus | '');
              setPage(1);
            }}
          >
            <option value="">Todos</option>
            <option value={PrescriptionStatus.PENDING}>Pendientes</option>
            <option value={PrescriptionStatus.CONSUMED}>Consumidas</option>
          </Select>

          {canFilterByPatient && (
            <Select
              label="Paciente"
              value={patientId}
              onChange={(e) => {
                setPatientId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos los pacientes</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </Select>
          )}

          {isAdmin && (
            <Select
              label="Médico"
              value={authorId}
              onChange={(e) => {
                setAuthorId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos los médicos</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.firstName} {d.lastName}
                </option>
              ))}
            </Select>
          )}

          <Input
            label="Desde"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />

          <Input
            label="Hasta"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <PageSpinner />
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : (
        <PrescriptionsTable
          prescriptions={prescriptions}
          meta={meta}
          userRole={user.role}
          page={page}
          onPageChange={setPage}
          onDeleted={(id) => setPrescriptions((prev) => prev.filter((rx) => rx.id !== id))}
          newHref="/dashboard/prescriptions/new"
        />
      )}
    </div>
  );
}

export default function PrescriptionsPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <PrescriptionsPageInner />
    </Suspense>
  );
}
