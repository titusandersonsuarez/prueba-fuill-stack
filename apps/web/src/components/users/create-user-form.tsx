'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { ApiError } from '@/lib/api-client';
import { usersService } from '@/services/users.service';
import { Role } from '@prescriptions/shared';

export function CreateUserForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role>(Role.PATIENT);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [speciality, setSpeciality] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const needsProfile = role === Role.DOCTOR || role === Role.PATIENT;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await usersService.create({
        email: email.trim(),
        password,
        role,
        ...(needsProfile && {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
        ...(role === Role.DOCTOR && {
          speciality: speciality.trim(),
          licenseNumber: licenseNumber.trim(),
        }),
        ...(role === Role.PATIENT && {
          dateOfBirth: dateOfBirth || undefined,
          phone: phone.trim() || undefined,
        }),
      });
      router.push('/dashboard/users');
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : 'Error al crear el usuario');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 max-w-xl">
      {/* Cuenta */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-800">Cuenta</h3>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <Select label="Rol" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value={Role.PATIENT}>Paciente</option>
          <option value={Role.DOCTOR}>Médico</option>
          <option value={Role.ADMIN}>Administrador</option>
        </Select>
      </div>

      {/* Perfil (doctor o paciente) */}
      {needsProfile && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="font-semibold text-slate-800">
            Perfil {role === Role.DOCTOR ? 'médico' : 'paciente'}
          </h3>
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

          {role === Role.DOCTOR && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Especialidad"
                value={speciality}
                onChange={(e) => setSpeciality(e.target.value)}
                required
              />
              <Input
                label="Nº de colegiado"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                required
              />
            </div>
          )}

          {role === Role.PATIENT && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Fecha de nacimiento"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
              <Input
                label="Teléfono"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+34 612 345 678"
              />
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          Crear usuario
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
