'use client';

import { useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { doctorsService } from '@/services/doctors.service';
import type { Doctor } from '@/types';

interface DoctorProfileFormProps {
  doctor: Doctor;
  onUpdated: (updated: Doctor) => void;
}

export function DoctorProfileForm({ doctor, onUpdated }: DoctorProfileFormProps) {
  const [firstName, setFirstName] = useState(doctor.firstName);
  const [lastName, setLastName] = useState(doctor.lastName);
  const [speciality, setSpeciality] = useState(doctor.speciality);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSaved(false);
    setLoading(true);
    try {
      const updated = await doctorsService.update(doctor.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        speciality: speciality.trim(),
      });
      onUpdated(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : 'Error al guardar los cambios');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Nombre"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <Input
          label="Apellido"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
      </div>
      <Input
        label="Especialidad"
        value={speciality}
        onChange={(e) => setSpeciality(e.target.value)}
        required
      />
      <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
        <p className="text-xs text-slate-500">
          Número de colegiado: <strong className="text-slate-700">{doctor.licenseNumber}</strong>
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Perfil actualizado correctamente
        </p>
      )}

      <Button type="submit" loading={loading}>
        Guardar cambios
      </Button>
    </form>
  );
}
