'use client';

import React from 'react';
import { FileText, BookOpen, ArrowRight } from 'lucide-react';

export type FormatoCreacion = 'relato' | 'historia';

interface Props {
  onSelect: (format: FormatoCreacion) => void;
}

const OPCIONES = [
  {
    key: 'relato' as const,
    icon: FileText,
    titulo: 'Relato corto',
    descripcion: 'Una sola publicación. Ideal para cuentos, escenas y textos breves con paginación automática.',
    badge: 'Disponible',
    badgeColor: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30',
    accent: 'hover:border-primary/50 hover:bg-primary/5',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10 border-primary/20',
  },
  {
    key: 'historia' as const,
    icon: BookOpen,
    titulo: 'Historia por capítulos',
    descripcion: 'Publica por entregas. Crea una obra principal y añade capítulos que los lectores esperan.',
    badge: 'Beta',
    badgeColor: 'bg-amber-400/15 text-amber-400 border-amber-400/30',
    accent: 'hover:border-accent/50 hover:bg-accent/5',
    iconColor: 'text-accent',
    iconBg: 'bg-accent/10 border-accent/20',
  },
] as const;

export default function FormatSelector({ onSelect }: Props) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">
          Nueva creación
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-gradient-gold mb-3">
          ¿Qué quieres crear?
        </h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Elige el formato que mejor se adapte a tu historia
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {OPCIONES.map(({ key, icon: Icon, titulo, descripcion, badge, badgeColor, accent, iconColor, iconBg }) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`group relative flex flex-col items-start gap-4 p-6 rounded-2xl border border-border bg-surface text-left transition-all duration-200 ${accent}`}
          >
            <div className="flex w-full items-start justify-between">
              <div className={`p-3 rounded-xl border ${iconBg}`}>
                <Icon size={22} className={iconColor} />
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border ${badgeColor}`}>
                {badge}
              </span>
            </div>

            <div className="flex-1">
              <h2 className="font-display text-lg font-semibold text-foreground mb-2">{titulo}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{descripcion}</p>
            </div>

            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Comenzar
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
