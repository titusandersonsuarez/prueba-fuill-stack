import type { MetricsSummary } from '@/services/metrics.service';

type TopDoctor = MetricsSummary['topDoctors'][number];

export function TopDoctorsList({ doctors }: { doctors: TopDoctor[] }) {
  if (doctors.length === 0) {
    return <p className="text-sm text-slate-400 py-4 text-center">Sin datos</p>;
  }

  const max = doctors[0]?.prescriptionCount ?? 1;

  return (
    <div className="space-y-3">
      {doctors.map((doc, i) => (
        <div key={doc.doctorId} className="flex items-center gap-3">
          <span className="w-5 text-xs font-bold text-slate-400">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-slate-800 truncate">Dr. {doc.name}</p>
              <span className="text-xs font-semibold text-primary-700 ml-2 shrink-0">
                {doc.prescriptionCount}
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${Math.round((doc.prescriptionCount / max) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{doc.speciality}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
