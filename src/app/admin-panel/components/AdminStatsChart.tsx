'use client';

import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

const storyViewsData = [
  { date: '07 Abr', views: 3200, likes: 420 },
  { date: '09 Abr', views: 4100, likes: 530 },
  { date: '11 Abr', views: 3800, likes: 490 },
  { date: '13 Abr', views: 5200, likes: 680 },
  { date: '15 Abr', views: 4700, likes: 610 },
  { date: '17 Abr', views: 6100, likes: 790 },
  { date: '19 Abr', views: 5600, likes: 720 },
  { date: '21 Abr', views: 7300, likes: 940 },
  { date: '23 Abr', views: 6800, likes: 880 },
  { date: '25 Abr', views: 8200, likes: 1060 },
  { date: '27 Abr', views: 7600, likes: 980 },
  { date: '29 Abr', views: 9100, likes: 1180 },
  { date: '01 May', views: 8700, likes: 1120 },
  { date: '03 May', views: 10200, likes: 1320 },
  { date: '05 May', views: 9800, likes: 1270 },
  { date: '07 May', views: 11400, likes: 1480 },
];

const storiesByCountryData = [
  { country: 'Colombia', count: 48, color: 'var(--primary)' },
  { country: 'México', count: 41, color: 'var(--accent)' },
  { country: 'Argentina', count: 35, color: 'var(--terracotta)' },
  { country: 'España', count: 22, color: 'var(--gold-light)' },
  { country: 'Venezuela', count: 14, color: 'var(--muted-foreground)' },
  { country: 'Chile', count: 18, color: 'var(--rose-soft)' },
];

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
  );
}

export function CountryBarChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={storiesByCountryData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="country" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
        <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" name="Relatos" radius={[4, 4, 0, 0]}>
          {storiesByCountryData.map((entry, index) => (
            <Cell key={`bar-country-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
