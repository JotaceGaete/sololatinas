'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronUp, Copy, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import type { Capitulo } from '@/lib/stories/types';

interface Props {
  storyTitle: string;
  storySlug: string;
  capitulos: Capitulo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string) => void;
  creating: boolean;
}

function estadoBadge(cap: Capitulo) {
  const e = (cap as any).estado;
  if (e === 'publicado') return <span className="text-[10px] text-emerald-400 font-medium">✓</span>;
  return <span className="text-[10px] text-muted-foreground/60">○</span>;
}

export default function ChapterSidebar({
  storyTitle, storySlug, capitulos, selectedId, onSelect, onCreate,
  onMoveUp, onMoveDown, onDuplicate, onDelete, onTogglePublish, creating,
}: Props) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const closeMenu = () => setMenuOpen(null);

  return (
    <aside className="flex flex-col h-full bg-surface border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Link
          href="/mis-relatos"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft size={12} /> Mis relatos
        </Link>
        <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">{storyTitle}</p>
        {storySlug && (
          <a
            href={`/historia/${storySlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary/70 hover:text-primary transition-colors mt-0.5 inline-block"
          >
            Ver publicación →
          </a>
        )}
      </div>

      {/* New chapter button */}
      <div className="p-3 border-b border-border">
        <button
          onClick={onCreate}
          disabled={creating}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-all disabled:opacity-50"
        >
          <Plus size={12} /> {creating ? 'Creando...' : 'Nuevo capítulo'}
        </button>
      </div>

      {/* Chapter list */}
      <div className="flex-1 overflow-y-auto py-2">
        {capitulos.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8 px-4">
            Aún no hay capítulos.<br />Crea el primero.
          </p>
        ) : (
          capitulos.map((cap, idx) => {
            const isSelected = cap.id === selectedId;
            const isPublished = (cap as any).estado === 'publicado';
            const isMenuOpen = menuOpen === cap.id;

            return (
              <div key={cap.id} className="relative">
                <div
                  className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary/10 border-l-2 border-primary'
                      : 'hover:bg-white/5 border-l-2 border-transparent'
                  }`}
                  onClick={() => { onSelect(cap.id); closeMenu(); }}
                >
                  <span className="w-5 text-xs text-center text-muted-foreground/60 flex-shrink-0">
                    {cap.numero}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-tight truncate ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {cap.titulo || `Capítulo ${cap.numero}`}
                    </p>
                  </div>
                  {estadoBadge(cap)}
                  {/* Reorder buttons */}
                  <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); onMoveUp(cap.id); }}
                      disabled={idx === 0}
                      className="p-0.5 text-muted-foreground/60 hover:text-foreground disabled:opacity-20 transition-colors"
                    >
                      <ChevronUp size={10} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onMoveDown(cap.id); }}
                      disabled={idx === capitulos.length - 1}
                      className="p-0.5 text-muted-foreground/60 hover:text-foreground disabled:opacity-20 transition-colors"
                    >
                      <ChevronDown size={10} />
                    </button>
                  </div>
                  {/* Context menu trigger */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(isMenuOpen ? null : cap.id); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground/60 hover:text-foreground transition-all flex-shrink-0 text-xs leading-none"
                    title="Más opciones"
                  >
                    ···
                  </button>
                </div>

                {/* Dropdown menu */}
                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={closeMenu} />
                    <div className="absolute right-2 top-full mt-0.5 w-44 bg-surface border border-border rounded-xl shadow-xl z-20 overflow-hidden py-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); onTogglePublish(cap.id); closeMenu(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-white/5 transition-colors"
                      >
                        {isPublished
                          ? <><EyeOff size={12} className="text-muted-foreground" /> Despublicar</>
                          : <><Eye size={12} className="text-emerald-400" /> Publicar</>
                        }
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDuplicate(cap.id); closeMenu(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-white/5 transition-colors"
                      >
                        <Copy size={12} className="text-muted-foreground" /> Duplicar
                      </button>
                      <div className="my-1 border-t border-border" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`¿Eliminar "${cap.titulo || `Capítulo ${cap.numero}`}"?`)) {
                            onDelete(cap.id);
                          }
                          closeMenu();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <Trash2 size={12} /> Eliminar
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          {capitulos.length} {capitulos.length === 1 ? 'capítulo' : 'capítulos'}
        </p>
      </div>
    </aside>
  );
}
