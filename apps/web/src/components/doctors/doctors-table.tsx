'use client';

import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import type { Doctor, PaginationMeta } from '@/types';

interface DoctorsTableProps {
  doctors: Doctor[];
  meta: PaginationMeta;
  page: number;
  onPageChange: (p: number) => void;
}

export function DoctorsTable({ doctors, meta, page, onPageChange }: DoctorsTableProps) {
  if (doctors.length === 0) {
    return <EmptyState title="Sin médicos" description="No hay médicos registrados." />;
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 text-left font-medium text-slate-600">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Email</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Especialidad</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Licencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {doctors.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {d.firstName} {d.lastName}
                </td>
                <td className="px-4 py-3 text-slate-500">{d.user.email}</td>
                <td className="px-4 py-3 text-slate-500">{d.speciality}</td>
                <td className="px-4 py-3 text-slate-500">{d.licenseNumber}</td>
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
