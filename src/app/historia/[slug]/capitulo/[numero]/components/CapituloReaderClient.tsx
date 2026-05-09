'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ArrowLeft } from 'lucide-react';
import ChapterNavigation from '@/components/ui/ChapterNavigation';
import type { Historia, HistoriaCapitulo } from '@/types/historias';

interface Props {
  historia: Historia;
  capitulo: HistoriaCapitulo;
  sanitizedHtml: string;
  prev: Pick<HistoriaCapitulo, 'numero' | 'titulo'> | null;
  next: Pick<HistoriaCapitulo, 'numero' | 'titulo'> | null;
  totalCapitulos: number;
}

export default function CapituloReaderClient({
  historia,
  capitulo,
  sanitizedHtml,
  prev,
  next,
  totalCapitulos,
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onScroll = () => {
      const { top, height } = el.getBoundingClientRect();
      const visible = window.innerHeight;
      const scrolled = Math.max(0, -top);
      const total = height - visible;
      setProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 100);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const slug = historia.slug ?? '';

  return (
    <>
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-border/40">
        <div
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-12" ref={contentRef}>
        {/* Back link */}
        <Link
          href={`/historia/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-10"
        >
          <ArrowLeft size={12} />
          <BookOpen size={12} />
          <span className="line-clamp-1">{historia.titulo}</span>
        </Link>

        {/* Chapter header */}
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-primary/70 uppercase tracking-widest">
              Capítulo {capitulo.numero}
              {totalCapitulos > 1 && (
                <span className="text-muted-foreground font-normal"> · {totalCapitulos} en total</span>
              )}
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
            {capitulo.titulo || `Capítulo ${capitulo.numero}`}
          </h1>
          {capitulo.published_at && (
            <p className="text-xs text-muted-foreground">
              Publicado el{' '}
              {new Date(capitulo.published_at).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </header>

        {/* Gold divider */}
        <div className="gold-divider mb-10" />

        {/* Story prose styles */}
        <style>{`
          .capitulo-prose p { margin: 0 0 1.75rem; text-align: justify; line-height: 1.95; }
          .capitulo-prose h2 { font-family: var(--font-display); font-size: 1.5rem; font-weight: 600; margin: 2.5rem 0 1rem; color: var(--primary); }
          .capitulo-prose h3 { font-family: var(--font-display); font-size: 1.25rem; font-weight: 600; margin: 2rem 0 0.75rem; }
          .capitulo-prose em, .capitulo-prose i { font-style: italic; }
          .capitulo-prose strong, .capitulo-prose b { font-weight: 700; }
          .capitulo-prose blockquote {
            border-left: 3px solid var(--primary);
            padding: 0.5rem 0 0.5rem 1.5rem;
            margin: 2rem 0;
            font-style: italic;
            opacity: 0.85;
          }
          .capitulo-prose ul, .capitulo-prose ol { margin: 0 0 1.75rem 1.5rem; }
          .capitulo-prose li { margin: 0.4rem 0; line-height: 1.7; }
          .capitulo-prose a { color: var(--primary); text-decoration: underline; text-underline-offset: 3px; }
        `}</style>

        {/* Chapter body */}
        {sanitizedHtml ? (
          <div
            className="capitulo-prose text-[18px] text-foreground font-display"
            style={{ lineHeight: '1.95', letterSpacing: '0.01em' }}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        ) : (
          <div className="py-20 text-center">
            <p className="text-muted-foreground text-sm">Este capítulo aún no tiene contenido.</p>
          </div>
        )}

        {/* End marker */}
        <div className="mt-16 mb-4">
          <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent mb-10" />
          <p className="text-center text-xs text-muted-foreground/60 font-display italic">
            — Fin del capítulo {capitulo.numero} —
          </p>
        </div>

        {/* Chapter navigation */}
        <ChapterNavigation
          historiaSlug={slug}
          historiaTitulo={historia.titulo}
          prev={prev}
          next={next}
        />
      </div>
    </>
  );
}
