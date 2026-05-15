'use client';

import { useState, useEffect } from 'react';
import { PageSpinner } from '@/components/ui/spinner';
import { PatientProfileForm } from '@/components/profile/patient-profile-form';
import { DoctorProfileForm } from '@/components/profile/doctor-profile-form';
import { useAuth } from '@/hooks/use-auth';
import { patientsService } from '@/services/patients.service';
import { doctorsService } from '@/services/doctors.service';
import { ApiError } from '@/lib/api-client';
import type { Patient, Doctor } from '@/types';
import { Role } from '@prescriptions/shared';

export default function ProfilePage() {
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    if (user.role === Role.PATIENT) {
      patientsService
        .getMe()
        .then(setPatient)
        .catch((err) =>
          setError(err instanceof ApiError ? err.body.message : 'Error al cargar tu perfil'),
        )
        .finally(() => setLoading(false));
    } else if (user.role === Role.DOCTOR) {
      doctorsService
        .getMe()
        .then(setDoctor)
        .catch((err) =>
          setError(err instanceof ApiError ? err.body.message : 'Error al cargar tu perfil'),
        )
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) return null;
  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Mi perfil</h1>
        <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {user.role === Role.PATIENT && patient && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
          <h2 className="font-semibold text-slate-800">Datos personales</h2>
          <PatientProfileForm patient={patient} onUpdated={setPatient} />
        </div>
      )}

      {user.role === Role.DOCTOR && doctor && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
          <h2 className="font-semibold text-slate-800">Datos del médico</h2>
          <DoctorProfileForm doctor={doctor} onUpdated={setDoctor} />
        </div>
      )}

      {user.role === Role.ADMIN && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">
            El administrador gestiona su cuenta desde el módulo de{' '}
            <strong className="text-slate-700">Usuarios</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
