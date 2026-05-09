import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import type { HistoriaCapitulo } from '@/types/historias';

interface ChapterNavigationProps {
  historiaSlug: string;
  historiaTitulo: string;
  prev: Pick<HistoriaCapitulo, 'numero' | 'titulo'> | null;
  next: Pick<HistoriaCapitulo, 'numero' | 'titulo'> | null;
}

export default function ChapterNavigation({
  historiaSlug,
  historiaTitulo,
  prev,
  next,
}: ChapterNavigationProps) {
  return (
    <nav className="border-t border-border pt-8 mt-16">
      {/* Back to obra */}
      <div className="text-center mb-8">
        <Link
          href={`/historia/${historiaSlug}`}
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <BookOpen size={12} />
          <span className="truncate max-w-xs">{historiaTitulo}</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Prev */}
        <div>
          {prev ? (
            <Link
              href={`/historia/${historiaSlug}/capitulo/${prev.numero}`}
              className="group flex flex-col gap-1 p-4 rounded-xl border border-border bg-surface hover:border-primary/30 hover:bg-primary/5 transition-all"
            >
              <span className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                <ChevronLeft size={12} />
                Anterior
              </span>
              <span className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {prev.titulo || `Capítulo ${prev.numero}`}
              </span>
              <span className="text-xs text-muted-foreground/60">Cap. {prev.numero}</span>
            </Link>
          ) : (
            <div />
          )}
        </div>

        {/* Next */}
        <div className="text-right">
          {next ? (
            <Link
              href={`/historia/${historiaSlug}/capitulo/${next.numero}`}
              className="group flex flex-col gap-1 p-4 rounded-xl border border-border bg-surface hover:border-primary/30 hover:bg-primary/5 transition-all"
            >
              <span className="flex items-center gap-1 justify-end text-xs text-muted-foreground group-hover:text-primary transition-colors">
                Siguiente
                <ChevronRight size={12} />
              </span>
              <span className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {next.titulo || `Capítulo ${next.numero}`}
              </span>
              <span className="text-xs text-muted-foreground/60">Cap. {next.numero}</span>
            </Link>
          ) : (
            <div className="flex flex-col gap-1 p-4 rounded-xl border border-border/30 bg-surface/40 text-right">
              <span className="text-xs text-muted-foreground/50">Próximamente</span>
              <span className="text-sm text-muted-foreground/40">Siguiente capítulo</span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
