'use client';

import React from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import type { Capitulo, Story } from '@/lib/stories/types';
import { BookOpen, Clock, ChevronRight, ArrowLeft } from 'lucide-react';

interface Props {
  story: Story;
  capitulos: Capitulo[];
}

export default function HistoriaIndexClient({ story, capitulos }: Props) {
  const totalReadingTime = capitulos.reduce((sum, c) => {
    const words = c.cuerpo.split(/\s+/).filter(Boolean).length;
    return sum + Math.max(1, Math.ceil(words / 200));
  }, 0);

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Back */}
      <div className="max-w-3xl mx-auto px-6 pt-6">
        <Link
          href="/stories-library"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Volver a la biblioteca
        </Link>
      </div>

      {/* Cover + meta */}
      <div className="max-w-3xl mx-auto px-6 pb-10">
        <div className="relative h-72 rounded-2xl overflow-hidden mb-8">
          <AppImage
            src={story.coverImage}
            alt={`Portada de ${story.title}`}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-noir/90 via-noir/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-1">
              {story.genre}
            </p>
            <h1 className="font-display text-3xl font-bold text-cream leading-tight">
              {story.title}
            </h1>
            <p className="text-sm text-cream/70 mt-1">por {story.author}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-8">
          <span className="flex items-center gap-1.5">
            <BookOpen size={14} className="text-primary" />
            {capitulos.length} {capitulos.length === 1 ? 'capítulo' : 'capítulos'}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} className="text-primary" />
            {totalReadingTime} min en total
          </span>
        </div>

        {/* Excerpt */}
        {story.excerpt && (
          <div className="border-l-2 border-primary/40 pl-5 mb-8">
            <p className="font-serif text-base text-muted-foreground italic leading-relaxed">
              {story.excerpt}
            </p>
          </div>
        )}

        {/* Chapter list */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Índice de capítulos
          </h2>
          {capitulos.map((cap) => {
            const wordCount = cap.cuerpo.split(/\s+/).filter(Boolean).length;
            const readTime = Math.max(1, Math.ceil(wordCount / 200));
            return (
              <Link
                key={cap.id}
                href={`/historia/${story.slug}/capitulo/${cap.numero}`}
                className="group flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-surface hover:border-primary/40 hover:bg-surface/80 transition-all"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {cap.numero}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {cap.titulo || `Capítulo ${cap.numero}`}
                    </p>
                    {cap.extracto && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {cap.extracto}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {readTime} min
                  </span>
                  <ChevronRight
                    size={16}
                    className="text-muted-foreground group-hover:text-primary transition-colors"
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Start reading CTA */}
        <div className="mt-10 text-center">
          <Link
            href={`/historia/${story.slug}/capitulo/1`}
            className="btn-primary px-10 py-3 text-sm inline-flex items-center gap-2"
          >
            <BookOpen size={16} /> Comenzar a leer
          </Link>
        </div>
      </div>
    </div>
  );
}
