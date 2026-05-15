import type { Metadata } from 'next';
import Link from 'next/link';
import { CreatePrescriptionForm } from '@/components/prescriptions/create-prescription-form';
import { RoleGuard } from '@/components/auth/role-guard';
import { Role } from '@prescriptions/shared';

export const metadata: Metadata = { title: 'Nueva receta — Prescriptions App' };

export default function NewPrescriptionPage() {
  return (
    <RoleGuard roles={[Role.DOCTOR, Role.ADMIN]}>
      <div className="space-y-5">
        <div>
          <nav className="text-xs text-slate-400 mb-1">
            <Link href="/dashboard/prescriptions" className="hover:text-slate-600">
              Recetas
            </Link>{' '}
            / Nueva
          </nav>
          <h1 className="text-xl font-bold text-slate-900">Nueva receta</h1>
        </div>
        <CreatePrescriptionForm />
      </div>
    </RoleGuard>
  );
}
