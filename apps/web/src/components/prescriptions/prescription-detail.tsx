'use client';

import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { formatDate, formatDateTime } from '@/lib/utils';
import { prescriptionsService } from '@/services/prescriptions.service';
import type { Prescription } from '@/types';
import { Role, PrescriptionStatus } from '@prescriptions/shared';

interface PrescriptionDetailProps {
  prescription: Prescription;
  userRole: Role;
  onUpdated: (updated: Prescription) => void;
}

export function PrescriptionDetail({ prescription, userRole, onUpdated }: PrescriptionDetailProps) {
  const router = useRouter();

  async function handleConsume() {
    if (!confirm('¿Confirmar consumo de esta receta?')) return;
    try {
      const updated = await prescriptionsService.consume(prescription.id);
      onUpdated(updated);
    } catch (err) {
      alert(err instanceof ApiError ? err.body.message : 'Error al consumir la receta');
    }
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar receta ${prescription.code}? Esta acción no se puede deshacer.`))
      return;
    try {
      await prescriptionsService.remove(prescription.id);
      router.push('/dashboard/prescriptions');
    } catch (err) {
      alert(err instanceof ApiError ? err.body.message : 'Error al eliminar');
    }
  }

  async function handlePdf() {
    try {
      await prescriptionsService.downloadPdf(prescription.id, prescription.code);
    } catch {
      alert('Error al generar el PDF');
    }
  }

  const canConsume =
    userRole === Role.PATIENT && prescription.status === PrescriptionStatus.PENDING;

  const canDelete = userRole === Role.DOCTOR || userRole === Role.ADMIN;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Código de receta</p>
            <p className="font-mono text-xl font-bold text-slate-900">{prescription.code}</p>
            <p className="text-xs text-slate-400 mt-1">{formatDateTime(prescription.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={prescription.status} />
            <Button variant="secondary" size="sm" onClick={() => void handlePdf()}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              Descargar PDF
            </Button>
            {canConsume && (
              <Button size="sm" onClick={() => void handleConsume()}>
                Marcar como consumida
              </Button>
            )}
            {canDelete && (
              <Button variant="danger" size="sm" onClick={() => void handleDelete()}>
                Eliminar
              </Button>
            )}
          </div>
        </div>

        {prescription.consumedAt && (
          <p className="mt-3 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
            Consumida el {formatDate(prescription.consumedAt)}
          </p>
        )}
      </div>

      {/* Doctor / Paciente */}
      <div className="grid sm:grid-cols-2 gap-4">
        <InfoCard title="Médico">
          <p className="font-medium text-slate-800">
            Dr. {prescription.author.firstName} {prescription.author.lastName}
          </p>
          <p className="text-sm text-slate-500">{prescription.author.speciality}</p>
        </InfoCard>
        <InfoCard title="Paciente">
          <p className="font-medium text-slate-800">
            {prescription.patient.firstName} {prescription.patient.lastName}
          </p>
        </InfoCard>
      </div>

      {/* Notas */}
      {prescription.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-medium text-amber-700 mb-1">Notas clínicas</p>
          <p className="text-sm text-amber-900">{prescription.notes}</p>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">
            Medicamentos ({prescription.items.length})
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">
                Medicamento
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Dosis</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">
                Frecuencia
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Cant.</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">
                Instrucciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {prescription.items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{item.medicationName}</td>
                <td className="px-4 py-3 text-slate-600">{item.dosage ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{item.frequency ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{item.quantity ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{item.instructions ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">{title}</p>
      {children}
    </div>
  );
}
