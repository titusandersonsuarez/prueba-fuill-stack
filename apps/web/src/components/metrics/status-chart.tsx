'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface StatusChartProps {
  pending: number;
  consumed: number;
}

const COLORS = { pending: '#eab308', consumed: '#16a34a' };

export function StatusChart({ pending, consumed }: StatusChartProps) {
  const data = [
    { name: 'Pendientes', value: pending, key: 'pending' as const },
    { name: 'Consumidas', value: consumed, key: 'consumed' as const },
  ];

  const total = pending + consumed;

  if (total === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">
        Sin datos de recetas
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.key} fill={COLORS[entry.key]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`${value} (${Math.round((value / total) * 100)}%)`]}
        />
        <Legend verticalAlign="bottom" height={32} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}
