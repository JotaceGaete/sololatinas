'use client';

import React, { useEffect } from 'react';
import { X, Clock, Globe, BookOpen } from 'lucide-react';
import { sanitizeStoryHtml } from '@/lib/relato-display';

interface PreviewModalProps {
  titulo: string;
  cuerpo: string;
  extracto: string;
  tags: string[];
  pais: string;
  categoria: string;
  coverPreview: string;
  readingTime: number;
  onClose: () => void;
}

export default function PreviewModal({
  titulo, cuerpo, extracto, tags, pais, categoria, coverPreview, readingTime, onClose
}: PreviewModalProps) {
  const safeBodyHtml = cuerpo
    ? sanitizeStoryHtml(cuerpo)
    : '<p class="text-muted-foreground italic">El cuerpo del relato aparecera aqui...</p>';

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl mx-4 my-8 bg-noir border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-up">
        {/* Modal header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-noir/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Vista Previa del Relato
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar vista previa"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cover image */}
        {coverPreview && (
          <div className="h-56 md:h-72 overflow-hidden">
            <img src={coverPreview} alt="Portada del relato" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div className="px-6 md:px-10 py-8">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-5 text-xs text-muted-foreground">
            {categoria && (
              <span className="flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full">
                <BookOpen size={10} />
                {categoria}
              </span>
            )}
            {pais && (
              <span className="flex items-center gap-1">
                <Globe size={12} />
                {pais}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {readingTime} min de lectura
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6 leading-tight">
            {titulo || 'Sin título'}
          </h1>

          {/* Excerpt */}
          {extracto && (
            <div className="border-l-2 border-primary/50 pl-5 mb-8">
              <p className="font-serif text-lg text-muted-foreground italic leading-relaxed">
                {extracto}
              </p>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {tags.map(tag => (
                <span key={tag} className="text-xs text-primary/70 bg-primary/8 border border-primary/20 px-3 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Body */}
          <div
            className="prose-preview font-serif text-lg text-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: safeBodyHtml }}
          />
        </div>

        {/* Footer */}
        <div className="px-6 md:px-10 py-6 border-t border-border bg-surface/30">
          <p className="text-xs text-muted-foreground text-center">
            Esta es una vista previa de cómo se verá tu relato publicado.
          </p>
        </div>
      </div>

      <style jsx global>{`
        .prose-preview h1 { font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: #c9a96e; margin: 1.5rem 0 0.75rem; }
        .prose-preview h2 { font-family: var(--font-display); font-size: 1.5rem; font-weight: 600; color: #c9a96e; margin: 1.25rem 0 0.5rem; }
        .prose-preview h3 { font-family: var(--font-display); font-size: 1.25rem; font-weight: 600; color: #d4a0b0; margin: 1rem 0 0.5rem; }
        .prose-preview p { margin: 0.75rem 0; }
        .prose-preview blockquote { border-left: 3px solid #c9a96e; padding-left: 1.25rem; margin: 1.25rem 0; color: #a89080; font-style: italic; }
        .prose-preview ul { list-style: disc; padding-left: 1.75rem; margin: 0.75rem 0; }
        .prose-preview ol { list-style: decimal; padding-left: 1.75rem; margin: 0.75rem 0; }
        .prose-preview li { margin: 0.35rem 0; }
        .prose-preview hr { border: none; border-top: 1px solid rgba(201,169,110,0.3); margin: 2rem 0; }
        .prose-preview strong { color: #f0e6d3; font-weight: 700; }
        .prose-preview em { color: #d4a0b0; }
      `}</style>
    </div>
  );
}
