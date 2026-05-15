import { apiClient } from '@/lib/api-client';
import type { Doctor, PagedResponse } from '@/types';

export interface UpdateDoctorPayload {
  firstName?: string;
  lastName?: string;
  speciality?: string;
}

export interface ListDoctorsParams {
  search?: string;
  speciality?: string;
}

export const doctorsService = {
  list: (page = 1, limit = 20, filters: ListDoctorsParams = {}) => {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters.search) qs.set('search', filters.search);
    if (filters.speciality) qs.set('speciality', filters.speciality);
    return apiClient.get<PagedResponse<Doctor>>(`/doctors?${qs.toString()}`);
  },

  getOne: (id: string) => apiClient.get<Doctor>(`/doctors/${id}`),

  getMe: () => apiClient.get<Doctor>('/doctors/me'),

  update: (id: string, payload: UpdateDoctorPayload) =>
    apiClient.patch<Doctor>(`/doctors/${id}`, payload),
};
