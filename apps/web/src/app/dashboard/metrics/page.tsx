'use client';

import { useState, useEffect } from 'react';
import { StatCard } from '@/components/metrics/stat-card';
import { TopDoctorsList } from '@/components/metrics/top-doctors-list';
import { DoctorStatsView } from '@/components/metrics/doctor-stats';
import { StatusChart } from '@/components/metrics/status-chart';
import { DailyChart } from '@/components/metrics/daily-chart';
import { RoleGuard } from '@/components/auth/role-guard';
import { PageSpinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { metricsService, type MetricsSummary, type DoctorStats } from '@/services/metrics.service';
import { ApiError } from '@/lib/api-client';
import { Role } from '@prescriptions/shared';

function AdminDashboard() {
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    metricsService
      .getSummary()
      .then(setSummary)
      .catch((err) =>
        setError(err instanceof ApiError ? err.body.message : 'Error al cargar métricas'),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!summary) return null;

  return (
    <div className="space-y-6">
      {/* Usuarios */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Usuarios
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total usuarios" value={summary.users.total} color="blue" />
          <StatCard label="Médicos" value={summary.users.doctors} color="slate" />
          <StatCard label="Pacientes" value={summary.users.patients} color="slate" />
          <StatCard label="Admins" value={summary.users.admin} color="slate" />
        </div>
      </section>

      {/* Recetas */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Recetas
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total" value={summary.prescriptions.total} color="blue" />
          <StatCard label="Pendientes" value={summary.prescriptions.pending} color="yellow" />
          <StatCard label="Consumidas" value={summary.prescriptions.consumed} color="green" />
          <StatCard
            label="Tasa de consumo"
            value={`${summary.prescriptions.consumptionRate}%`}
            color="green"
            sub="del total"
          />
        </div>
      </section>

      {/* Actividad */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Actividad reciente
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Últimos 7 días"
            value={summary.activity.last7Days}
            sub="nuevas recetas"
            color="blue"
          />
          <StatCard
            label="Últimos 30 días"
            value={summary.activity.last30Days}
            sub="nuevas recetas"
            color="slate"
          />
        </div>
      </section>

      {/* Gráficos */}
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-2">Recetas por estado</h2>
          <StatusChart
            pending={summary.prescriptions.pending}
            consumed={summary.prescriptions.consumed}
          />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-800 mb-2">Recetas por día (últimos 30 días)</h2>
          <DailyChart data={summary.byDay} />
        </div>
      </section>

      {/* Top médicos */}
      <section>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Top 5 médicos por volumen</h2>
          <TopDoctorsList doctors={summary.topDoctors} />
        </div>
      </section>
    </div>
  );
}

function DoctorDashboard() {
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    metricsService
      .getMyStats()
      .then(setStats)
      .catch((err) =>
        setError(err instanceof ApiError ? err.body.message : 'Error al cargar estadísticas'),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!stats) return null;

  return <DoctorStatsView stats={stats} />;
}

export default function MetricsPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          {user.role === Role.ADMIN ? 'Dashboard' : 'Mis estadísticas'}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {user.role === Role.ADMIN
            ? 'Resumen global del sistema'
            : 'Tus métricas de prescripciones'}
        </p>
      </div>

      {user.role === Role.ADMIN && (
        <RoleGuard roles={[Role.ADMIN]}>
          <AdminDashboard />
        </RoleGuard>
      )}
      {user.role === Role.DOCTOR && (
        <RoleGuard roles={[Role.DOCTOR]}>
          <DoctorDashboard />
        </RoleGuard>
      )}
    </div>
  );
}
