'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { PrescriptionDetail } from '@/components/prescriptions/prescription-detail';
import { PageSpinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { prescriptionsService } from '@/services/prescriptions.service';
import { ApiError } from '@/lib/api-client';
import type { Prescription } from '@/types';

export default function PrescriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    prescriptionsService
      .getOne(id)
      .then(setPrescription)
      .catch((err) =>
        setError(err instanceof ApiError ? err.body.message : 'Error al cargar la receta'),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageSpinner />;

  if (error || !prescription) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 mb-4">{error || 'Receta no encontrada'}</p>
        <Link href="/dashboard/prescriptions" className="text-primary-600 hover:underline text-sm">
          ← Volver a recetas
        </Link>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-4">
      <nav className="text-xs text-slate-400">
        <Link href="/dashboard/prescriptions" className="hover:text-slate-600">
          Recetas
        </Link>{' '}
        / {prescription.code}
      </nav>
      <PrescriptionDetail
        prescription={prescription}
        userRole={user.role}
        onUpdated={setPrescription}
      />
    </div>
  );
}
