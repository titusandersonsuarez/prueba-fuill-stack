'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { formatDate } from '@/lib/utils';
import type { Patient, PaginationMeta } from '@/types';

interface PatientsTableProps {
  patients: Patient[];
  meta: PaginationMeta;
  page: number;
  onPageChange: (p: number) => void;
}

export function PatientsTable({ patients, meta, page, onPageChange }: PatientsTableProps) {
  if (patients.length === 0) {
    return <EmptyState title="Sin pacientes" description="No hay pacientes registrados." />;
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 text-left font-medium text-slate-600">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Email</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Teléfono</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Nacimiento</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">Ver</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {p.firstName} {p.lastName}
                </td>
                <td className="px-4 py-3 text-slate-500">{p.user.email}</td>
                <td className="px-4 py-3 text-slate-500">{p.phone ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(p.dateOfBirth)}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/dashboard/patients/${p.id}`}
                    className="text-primary-600 hover:underline text-xs font-medium"
                  >
                    Ver perfil →
                  </Link>
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
