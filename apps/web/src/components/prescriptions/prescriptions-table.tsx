'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { ApiError } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { prescriptionsService } from '@/services/prescriptions.service';
import type { Prescription, PaginationMeta } from '@/types';
import { Role } from '@prescriptions/shared';

interface PrescriptionsTableProps {
  prescriptions: Prescription[];
  meta: PaginationMeta;
  userRole: Role;
  page: number;
  onPageChange: (p: number) => void;
  onDeleted: (id: string) => void;
  newHref?: string;
}

export function PrescriptionsTable({
  prescriptions,
  meta,
  userRole,
  page,
  onPageChange,
  onDeleted,
  newHref,
}: PrescriptionsTableProps) {
  async function handleDelete(prescription: Prescription) {
    if (!confirm(`¿Eliminar receta ${prescription.code}?`)) return;
    try {
      await prescriptionsService.remove(prescription.id);
      onDeleted(prescription.id);
    } catch (err) {
      alert(err instanceof ApiError ? err.body.message : 'Error al eliminar');
    }
  }

  async function handlePdf(prescription: Prescription) {
    try {
      await prescriptionsService.downloadPdf(prescription.id, prescription.code);
    } catch {
      alert('Error al descargar el PDF');
    }
  }

  if (prescriptions.length === 0) {
    return (
      <EmptyState
        title="No hay recetas"
        description="Aún no existe ninguna receta para mostrar."
        action={
          newHref && userRole === Role.DOCTOR ? (
            <Link href={newHref}>
              <Button size="sm">Nueva receta</Button>
            </Link>
          ) : undefined
        }
      />
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 text-left font-medium text-slate-600">Código</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Paciente</th>
              {userRole !== Role.DOCTOR && (
                <th className="px-4 py-3 text-left font-medium text-slate-600">Médico</th>
              )}
              <th className="px-4 py-3 text-left font-medium text-slate-600">Medicamentos</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Fecha</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {prescriptions.map((rx) => (
              <tr key={rx.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/prescriptions/${rx.id}`}
                    className="font-mono font-semibold text-primary-600 hover:underline text-xs"
                  >
                    {rx.code}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={rx.status} />
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {rx.patient.firstName} {rx.patient.lastName}
                </td>
                {userRole !== Role.DOCTOR && (
                  <td className="px-4 py-3 text-slate-700">
                    Dr. {rx.author.firstName} {rx.author.lastName}
                  </td>
                )}
                <td className="px-4 py-3 text-slate-500">{rx.items.length} ítem(s)</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(rx.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => void handlePdf(rx)}
                      title="Descargar PDF"
                      className="text-slate-400 hover:text-primary-600 transition-colors p-1"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                        />
                      </svg>
                    </button>
                    {(userRole === Role.DOCTOR || userRole === Role.ADMIN) && (
                      <button
                        onClick={() => void handleDelete(rx)}
                        title="Eliminar"
                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={meta.totalPages}
        total={meta.total}
        limit={meta.limit}
        onPageChange={onPageChange}
      />
    </div>
  );
}
