import { StatCard } from './stat-card';
import type { DoctorStats } from '@/services/metrics.service';

export function DoctorStatsView({ stats }: { stats: DoctorStats }) {
  const { prescriptions, doctor } = stats;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">
          Mis estadísticas — Dr. {doctor.firstName} {doctor.lastName}
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total recetas" value={prescriptions.total} color="blue" />
        <StatCard label="Pendientes" value={prescriptions.pending} color="yellow" />
        <StatCard label="Consumidas" value={prescriptions.consumed} color="green" />
        <StatCard label="Últimos 30 días" value={prescriptions.last30Days} color="slate" />
      </div>
      {prescriptions.total > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-2">Tasa de consumo</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{
                  width: `${Math.round((prescriptions.consumed / prescriptions.total) * 100)}%`,
                }}
              />
            </div>
            <span className="text-sm font-semibold text-green-700">
              {Math.round((prescriptions.consumed / prescriptions.total) * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
