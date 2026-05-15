import { apiClient } from '@/lib/api-client';
import { Role } from '@prescriptions/shared';

export interface LoginResponse {
  accessToken: string;
  user: { id: string; email: string; role: Role };
}

export const authService = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/auth/login', { email, password }),

  logout: () => apiClient.post<void>('/auth/logout'),

  profile: () => apiClient.get<{ sub: string; email: string; role: Role }>('/auth/profile'),
};
