'use client';

import React from 'react';
import {
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { BarChart2 } from 'lucide-react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-elevated border border-border rounded-lg p-3 text-xs shadow-xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={`tooltip-${entry.name}`} style={{ color: entry.color }} className="font-semibold">
          {entry.name}: {entry.value.toLocaleString('es')}
        </p>
      ))}
    </div>
  );
}

export function ViewsAreaChart() {
  return (
    <div className="h-[220px] flex flex-col items-center justify-center gap-3">
      <BarChart2 size={32} className="text-muted-foreground/25" />
      <p className="text-sm text-muted-foreground">Analíticas en tiempo real</p>
      <p className="text-xs text-muted-foreground/50">Disponible próximamente</p>
    </div>
  );
}

export interface CountryChartEntry {
  country: string;
  count: number;
  color?: string;
}

interface CountryBarChartProps {
  data: CountryChartEntry[];
}

export function CountryBarChart({ data }: CountryBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Sin datos aún</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="country" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
        <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" name="Relatos" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`bar-country-${index}`} fill={entry.color ?? 'var(--primary)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
