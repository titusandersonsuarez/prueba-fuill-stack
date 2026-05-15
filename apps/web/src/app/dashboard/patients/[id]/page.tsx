'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { PageSpinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/utils';
import { patientsService } from '@/services/patients.service';
import { ApiError } from '@/lib/api-client';
import type { Patient } from '@/types';

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    patientsService
      .getOne(id)
      .then(setPatient)
      .catch((err) =>
        setError(err instanceof ApiError ? err.body.message : 'Error al cargar el paciente'),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageSpinner />;

  if (error || !patient) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 mb-4">{error || 'Paciente no encontrado'}</p>
        <Link href="/dashboard/patients" className="text-primary-600 hover:underline text-sm">
          ← Volver a pacientes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <nav className="text-xs text-slate-400">
        <Link href="/dashboard/patients" className="hover:text-slate-600">
          Pacientes
        </Link>{' '}
        / {patient.firstName} {patient.lastName}
      </nav>

      <h1 className="text-xl font-bold text-slate-900">
        {patient.firstName} {patient.lastName}
      </h1>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        <Row label="Email" value={patient.user.email} />
        <Row label="Teléfono" value={patient.phone ?? '—'} />
        <Row label="Fecha de nacimiento" value={formatDate(patient.dateOfBirth)} />
        <Row label="Registrado" value={formatDate(patient.user.createdAt)} />
      </div>

      <div className="flex gap-3">
        <Link href={`/dashboard/prescriptions?patientId=${patient.id}`}>
          <button className="text-sm text-primary-600 hover:underline font-medium">
            Ver recetas de este paciente →
          </button>
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  );
}
