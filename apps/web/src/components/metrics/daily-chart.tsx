'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DailyChartProps {
  data: { date: string; count: number }[];
}

/** Etiqueta corta DD/MM a partir de una fecha YYYY-MM-DD (sin parsear a Date local). */
function shortLabel(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

export function DailyChart({ data }: DailyChartProps) {
  const chartData = data.map((d) => ({ ...d, label: shortLabel(d.date) }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="rxGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          interval={4}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          width={28}
        />
        <Tooltip
          labelFormatter={(label: string) => `Día ${label}`}
          formatter={(value: number) => [value, 'Recetas']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#2563eb"
          strokeWidth={2}
          fill="url(#rxGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
