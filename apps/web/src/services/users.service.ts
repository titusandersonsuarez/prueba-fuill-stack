import { apiClient } from '@/lib/api-client';
import type { PagedResponse } from '@/types';
import { Role } from '@prescriptions/shared';

export interface AdminUser {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    speciality: string;
    licenseNumber: string;
  } | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string | null;
    phone: string | null;
  } | null;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  role: Role;
  firstName?: string;
  lastName?: string;
  speciality?: string;
  licenseNumber?: string;
  dateOfBirth?: string;
  phone?: string;
}

export interface ListUsersParams {
  search?: string;
  role?: Role;
}

export const usersService = {
  list: (page = 1, limit = 20, filters: ListUsersParams = {}) => {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters.search) qs.set('search', filters.search);
    if (filters.role) qs.set('role', filters.role);
    return apiClient.get<PagedResponse<AdminUser>>(`/users?${qs.toString()}`);
  },

  getOne: (id: string) => apiClient.get<AdminUser>(`/users/${id}`),

  create: (payload: CreateUserPayload) => apiClient.post<AdminUser>('/users', payload),

  remove: (id: string) => apiClient.delete(`/users/${id}`),
};
