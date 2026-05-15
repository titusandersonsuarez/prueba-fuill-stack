import { apiClient } from '@/lib/api-client';

export interface MetricsSummary {
  users: { total: number; admin: number; doctors: number; patients: number };
  prescriptions: { total: number; pending: number; consumed: number; consumptionRate: number };
  activity: { last7Days: number; last30Days: number };
  topDoctors: { doctorId: string; name: string; speciality: string; prescriptionCount: number }[];
}

export interface DoctorStats {
  doctor: { id: string; firstName: string; lastName: string };
  prescriptions: { total: number; pending: number; consumed: number; last30Days: number };
}

export const metricsService = {
  getSummary: () => apiClient.get<MetricsSummary>('/metrics'),
  getMyStats: () => apiClient.get<DoctorStats>('/metrics/my-stats'),
};
