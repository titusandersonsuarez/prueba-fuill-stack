import { apiClient, getAccessToken } from '@/lib/api-client';
import type { Prescription, PagedResponse } from '@/types';
import type { PrescriptionStatus } from '@prescriptions/shared';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface ListPrescriptionsParams {
  page?: number;
  limit?: number;
  status?: PrescriptionStatus;
  patientId?: string;
  authorId?: string;
  code?: string;
  from?: string;
  to?: string;
}

export interface CreatePrescriptionPayload {
  patientId: string;
  notes?: string;
  items: {
    medicationName: string;
    dosage?: string;
    frequency?: string;
    quantity?: number;
    instructions?: string;
  }[];
}

export const prescriptionsService = {
  list: (params: ListPrescriptionsParams = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.status) qs.set('status', params.status);
    if (params.patientId) qs.set('patientId', params.patientId);
    if (params.authorId) qs.set('authorId', params.authorId);
    if (params.code) qs.set('code', params.code);
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    const query = qs.toString();
    return apiClient.get<PagedResponse<Prescription>>(`/prescriptions${query ? `?${query}` : ''}`);
  },

  getOne: (id: string) => apiClient.get<Prescription>(`/prescriptions/${id}`),

  create: (payload: CreatePrescriptionPayload) =>
    apiClient.post<Prescription>('/prescriptions', payload),

  consume: (id: string) => apiClient.patch<Prescription>(`/prescriptions/${id}/consume`),

  remove: (id: string) => apiClient.delete(`/prescriptions/${id}`),

  async downloadPdf(id: string, code: string): Promise<void> {
    const token = getAccessToken();
    const res = await fetch(`${BASE}/prescriptions/${id}/pdf`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Error al generar el PDF');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescripcion-${code}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
