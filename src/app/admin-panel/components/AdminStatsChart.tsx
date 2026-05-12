'use client';

import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { storyViewsData } from '@/lib/mockData';

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
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={storyViewsData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="adminViewsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="adminLikesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="views" name="Vistas" stroke="var(--primary)" fill="url(#adminViewsGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="likes" name="Likes" stroke="var(--accent)" fill="url(#adminLikesGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-muted-foreground/50 text-center mt-1">
        Datos de ejemplo — próximamente analíticas en tiempo real
      </p>
    </div>
  );
}

interface CountryChartEntry {
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
