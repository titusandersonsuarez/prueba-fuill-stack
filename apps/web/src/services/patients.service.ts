import { apiClient } from '@/lib/api-client';
import type { Patient, PagedResponse } from '@/types';

export interface UpdatePatientPayload {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phone?: string;
}

export interface ListPatientsParams {
  search?: string;
}

export const patientsService = {
  list: (page = 1, limit = 20, filters: ListPatientsParams = {}) => {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters.search) qs.set('search', filters.search);
    return apiClient.get<PagedResponse<Patient>>(`/patients?${qs.toString()}`);
  },

  getOne: (id: string) => apiClient.get<Patient>(`/patients/${id}`),

  getMe: () => apiClient.get<Patient>('/patients/me'),

  update: (id: string, payload: UpdatePatientPayload) =>
    apiClient.patch<Patient>(`/patients/${id}`, payload),
};
