'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import type { Capitulo, CapituloMediaBlock, Story } from '@/lib/stories/types';
import { renderStoryHtml, splitIntoPages } from '@/lib/stories/render';
import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight, List } from 'lucide-react';

const WORDS_TARGET = 1500;
const WORDS_MIN = 1200;
const WORDS_MAX = 1800;

interface Props {
  story: Story;
  capitulo: Capitulo;
  allCapitulos: Capitulo[];
}

function MediaBlock({ block }: { block: CapituloMediaBlock }) {
  if (block.tipo === 'separador') {
    return (
      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <span className="text-primary/50 text-xs">✦</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>
    );
  }
  if (block.tipo === 'imagen' && block.url) {
    return (
      <figure className="my-8">
        <div className="rounded-xl overflow-hidden">
          <AppImage
            src={block.url}
            alt={block.alt || ''}
            width={800}
            height={450}
            className="w-full object-cover"
          />
        </div>
        {block.caption && (
          <figcaption className="text-xs text-muted-foreground text-center mt-2 italic">
            {block.caption}
          </figcaption>
        )}
      </figure>
    );
  }
  if (block.tipo === 'video' && block.url) {
    return (
      <div className="my-8 rounded-xl overflow-hidden aspect-video">
        <video src={block.url} controls className="w-full h-full" />
      </div>
    );
  }
  return null;
}

export default function ChapterReaderClient({ story, capitulo, allCapitulos }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [indexOpen, setIndexOpen] = useState(false);

  const pages = useMemo(
    () => splitIntoPages(capitulo.cuerpo, WORDS_TARGET, WORDS_MIN, WORDS_MAX),
    [capitulo.cuerpo],
  );
  const totalPages = pages.length;

  const prevCapitulo = allCapitulos.find((c) => c.numero === capitulo.numero - 1) ?? null;
  const nextCapitulo = allCapitulos.find((c) => c.numero === capitulo.numero + 1) ?? null;

  // Media blocks before / after text (posicion-based)
  const beforeBlocks = (capitulo.mediaBlocks ?? []).filter((b) => b.posicion === 0);
  const afterBlocks = (capitulo.mediaBlocks ?? []).filter((b) => b.posicion > 0);

  return (
    <div className="min-h-screen bg-[#0D0B0A]">
      <style>{`
        .ch-content p { margin-bottom: 1.75rem; text-align: justify; }
        .ch-content h1,.ch-content h2,.ch-content h3 { font-family: var(--font-display); color: #C9A96E; margin: 1.5rem 0 0.75rem; font-weight: 700; }
        .ch-content blockquote { border-left: 3px solid #C9A96E; padding-left: 1.25rem; margin: 1.25rem 0; font-style: italic; opacity: 0.85; }
        .ch-content strong { font-weight: 700; }
        .ch-content em { font-style: italic; }
        .ch-content hr { border: none; border-top: 1px solid rgba(201,169,110,0.3); margin: 2rem 0; }
      `}</style>

      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0D0B0A]/95 backdrop-blur-sm border-b border-[#2E2420] h-12 flex items-center px-4 gap-3">
        <Link
          href={`/historia/${story.slug}`}
          className="p-1.5 text-[#9A8A7A] hover:text-[#F5EFE6] transition-colors"
          title="Índice"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1 min-w-0 text-center">
          <p className="text-xs text-[#9A8A7A] truncate">
            {story.title} — {capitulo.titulo || `Capítulo ${capitulo.numero}`}
          </p>
        </div>
        <button
          onClick={() => setIndexOpen((v) => !v)}
          className="p-1.5 text-[#9A8A7A] hover:text-[#F5EFE6] transition-colors"
          title="Capítulos"
        >
          <List size={16} />
        </button>
      </header>

      {/* Chapter index drawer */}
      {indexOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIndexOpen(false)} />
          <div className="relative w-72 h-full bg-[#1A1614] border-l border-[#2E2420] overflow-y-auto p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A96E] mb-4">
              Capítulos
            </p>
            <div className="space-y-1">
              {allCapitulos.map((c) => (
                <Link
                  key={c.id}
                  href={`/historia/${story.slug}/capitulo/${c.numero}`}
                  onClick={() => setIndexOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    c.numero === capitulo.numero
                      ? 'bg-primary/15 text-primary font-medium'
                      : 'text-[#9A8A7A] hover:text-[#F5EFE6] hover:bg-white/5'
                  }`}
                >
                  <span className="w-5 text-xs text-center opacity-60">{c.numero}</span>
                  <span className="truncate">{c.titulo || `Capítulo ${c.numero}`}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="pt-20 pb-24 max-w-2xl mx-auto px-6">
        {/* Chapter header */}
        <div className="mb-10 text-center">
          <p className="text-xs text-[#C9A96E] font-semibold uppercase tracking-widest mb-2">
            Capítulo {capitulo.numero}
          </p>
          <h1 className="font-display text-2xl font-bold text-[#F5EFE6]">
            {capitulo.titulo || `Capítulo ${capitulo.numero}`}
          </h1>
          {capitulo.extracto && (
            <p className="mt-3 text-sm text-[#9A8A7A] italic leading-relaxed max-w-lg mx-auto">
              {capitulo.extracto}
            </p>
          )}
        </div>

        {/* Media before text */}
        {beforeBlocks.map((b) => <MediaBlock key={b.id} block={b} />)}

        {/* Page content */}
        {totalPages > 1 && (
          <p className="text-xs text-[#9A8A7A] text-center mb-6">
            — Página {currentPage} de {totalPages} —
          </p>
        )}
        <div
          className="ch-content font-display text-[#F5EFE6] leading-[1.95] text-lg"
          dangerouslySetInnerHTML={{ __html: pages[currentPage - 1] ?? '' }}
        />

        {/* Media after text */}
        {afterBlocks.map((b) => <MediaBlock key={b.id} block={b} />)}

        {/* In-chapter pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-[#2E2420] text-[#9A8A7A] hover:text-[#F5EFE6] hover:border-[#C9A96E]/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs text-[#9A8A7A] tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-[#2E2420] text-[#9A8A7A] hover:text-[#F5EFE6] hover:border-[#C9A96E]/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Chapter navigation */}
        {currentPage === totalPages && (
          <div className="mt-14 pt-8 border-t border-[#2E2420]">
            <div className="flex items-center justify-between gap-4">
              {prevCapitulo ? (
                <Link
                  href={`/historia/${story.slug}/capitulo/${prevCapitulo.numero}`}
                  className="flex items-center gap-2 text-sm text-[#9A8A7A] hover:text-[#C9A96E] transition-colors"
                  onClick={() => setCurrentPage(1)}
                >
                  <ArrowLeft size={14} />
                  <span className="truncate max-w-[140px]">
                    {prevCapitulo.titulo || `Cap. ${prevCapitulo.numero}`}
                  </span>
                </Link>
              ) : (
                <Link
                  href={`/historia/${story.slug}`}
                  className="flex items-center gap-2 text-sm text-[#9A8A7A] hover:text-[#C9A96E] transition-colors"
                >
                  <BookOpen size={14} /> Índice
                </Link>
              )}
              {nextCapitulo ? (
                <Link
                  href={`/historia/${story.slug}/capitulo/${nextCapitulo.numero}`}
                  className="flex items-center gap-2 text-sm text-[#9A8A7A] hover:text-[#C9A96E] transition-colors"
                  onClick={() => setCurrentPage(1)}
                >
                  <span className="truncate max-w-[140px]">
                    {nextCapitulo.titulo || `Cap. ${nextCapitulo.numero}`}
                  </span>
                  <ArrowRight size={14} />
                </Link>
              ) : (
                <Link
                  href={`/historia/${story.slug}`}
                  className="flex items-center gap-2 text-sm text-[#C9A96E] font-medium hover:text-[#E8C97A] transition-colors"
                >
                  Fin ✦ <BookOpen size={14} />
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
