import React from 'react';
import Link from 'next/link';
import { Hash, Lock, Clock, ChevronRight } from 'lucide-react';
import type { HistoriaCapitulo } from '@/types/historias';

interface ChapterListProps {
  capitulos: HistoriaCapitulo[];
  historiaSlug: string;
  currentNumero?: number;
  showStatus?: boolean;
}

function calcReadingTime(html: string | null): number {
  if (!html) return 1;
  const words = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function ChapterList({
  capitulos,
  historiaSlug,
  currentNumero,
  showStatus = false,
}: ChapterListProps) {
  if (capitulos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center mb-4">
          <Hash size={20} className="text-muted-foreground/40" />
        </div>
        <p className="text-sm text-muted-foreground">Aún no hay capítulos publicados</p>
      </div>
    );
  }

  return (
    <ol className="space-y-2">
      {capitulos.map((c) => {
        const isPublished = c.estado === 'publicado';
        const isCurrent = c.numero === currentNumero;
        const href = isPublished
          ? `/historia/${historiaSlug}/capitulo/${c.numero}`
          : undefined;
        const readTime = calcReadingTime(c.cuerpo_html ?? null);

        const inner = (
          <div
            className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-200 ${
              isCurrent
                ? 'border-primary/40 bg-primary/8'
                : isPublished
                ? 'border-border bg-surface hover:border-primary/30 hover:bg-primary/5 cursor-pointer'
                : 'border-border/40 bg-surface/40 opacity-60 cursor-not-allowed'
            }`}
          >
            {/* Número */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                isCurrent
                  ? 'bg-primary text-noir'
                  : isPublished
                  ? 'bg-surface-elevated text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary'
                  : 'bg-surface-elevated text-muted-foreground/40'
              }`}
            >
              {c.numero}
            </div>

            {/* Título + meta */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium truncate transition-colors ${
                  isCurrent
                    ? 'text-primary'
                    : isPublished
                    ? 'text-foreground group-hover:text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {c.titulo || `Capítulo ${c.numero}`}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {isPublished && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={10} />
                    {readTime} min
                  </span>
                )}
                {showStatus && (
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                      c.estado === 'publicado'
                        ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30'
                        : c.estado === 'revision'
                        ? 'bg-amber-400/10 text-amber-400 border-amber-400/30'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {c.estado}
                  </span>
                )}
                {c.published_at && !showStatus && (
                  <span className="text-xs text-muted-foreground/60">
                    {new Date(c.published_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Right icon */}
            <div className="flex-shrink-0">
              {isPublished ? (
                <ChevronRight
                  size={14}
                  className={`transition-colors ${
                    isCurrent
                      ? 'text-primary'
                      : 'text-muted-foreground/40 group-hover:text-primary'
                  }`}
                />
              ) : (
                <Lock size={12} className="text-muted-foreground/30" />
              )}
            </div>
          </div>
        );

        return (
          <li key={c.id}>
            {href ? <Link href={href}>{inner}</Link> : inner}
          </li>
        );
      })}
    </ol>
  );
}
