'use client';

import React, { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { List, X } from 'lucide-react';
import type { Capitulo, Story } from '@/lib/stories/types';
import ChapterSidebar from './ChapterSidebar';
import ChapterEditorPanel from './ChapterEditorPanel';

interface Props {
  story: Story;
  initialCapitulos: Capitulo[];
  userId: string;
}

export default function CapitulosManagerClient({ story, initialCapitulos, userId }: Props) {
  const [capitulos, setCapitulos] = useState<Capitulo[]>(initialCapitulos);
  const [selectedId, setSelectedId] = useState<string | null>(initialCapitulos[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const supabase = createClient();

  const selected = capitulos.find((c) => c.id === selectedId) ?? null;

  const handleCreate = useCallback(async () => {
    setCreating(true);
    const nextNumero = capitulos.length > 0 ? Math.max(...capitulos.map((c) => c.numero)) + 1 : 1;
    const { data, error } = await supabase
      .from('historia_capitulos')
      .insert({
        historia_id: story.id,
        numero: nextNumero,
        titulo: '',
        cuerpo_html: '',
        estado: 'borrador',
      })
      .select()
      .single();
    setCreating(false);
    if (error || !data) {
      toast.error('Error al crear capítulo');
      return;
    }
    const newCap: Capitulo = {
      id: data.id,
      relatoId: story.id,
      numero: data.numero,
      titulo: data.titulo || '',
      cuerpo: data.cuerpo_html || '',
      extracto: '',
      publishedAt: data.published_at,
      createdAt: data.created_at,
      mediaBlocks: [],
    };
    setCapitulos((prev) => [...prev, newCap]);
    setSelectedId(newCap.id);
  }, [capitulos, story.id, supabase]);

  const handleUpdated = useCallback((updated: Capitulo) => {
    setCapitulos((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
  }, []);

  const handleDeleted = useCallback((id: string) => {
    setCapitulos((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (selectedId === id) {
        setSelectedId(remaining[0]?.id ?? null);
      }
      return remaining;
    });
  }, [selectedId]);

  const handleMoveUp = useCallback(async (id: string) => {
    const idx = capitulos.findIndex((c) => c.id === id);
    if (idx <= 0) return;
    const a = capitulos[idx - 1];
    const b = capitulos[idx];
    await Promise.all([
      supabase.from('historia_capitulos').update({ numero: b.numero }).eq('id', a.id),
      supabase.from('historia_capitulos').update({ numero: a.numero }).eq('id', b.id),
    ]);
    setCapitulos((prev) => {
      const next = [...prev];
      next[idx - 1] = { ...b, numero: a.numero };
      next[idx] = { ...a, numero: b.numero };
      return next.sort((x, y) => x.numero - y.numero);
    });
  }, [capitulos, supabase]);

  const handleMoveDown = useCallback(async (id: string) => {
    const idx = capitulos.findIndex((c) => c.id === id);
    if (idx >= capitulos.length - 1) return;
    const a = capitulos[idx];
    const b = capitulos[idx + 1];
    await Promise.all([
      supabase.from('historia_capitulos').update({ numero: b.numero }).eq('id', a.id),
      supabase.from('historia_capitulos').update({ numero: a.numero }).eq('id', b.id),
    ]);
    setCapitulos((prev) => {
      const next = [...prev];
      next[idx] = { ...b, numero: a.numero };
      next[idx + 1] = { ...a, numero: b.numero };
      return next.sort((x, y) => x.numero - y.numero);
    });
  }, [capitulos, supabase]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar — desktop: always visible, mobile: drawer */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-200
          md:relative md:translate-x-0 md:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <ChapterSidebar
          storyTitle={story.title}
          storySlug={story.slug ?? ''}
          capitulos={capitulos}
          selectedId={selectedId}
          onSelect={(id) => { setSelectedId(id); setSidebarOpen(false); }}
          onCreate={handleCreate}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          creating={creating}
        />
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main editor area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile only) */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-surface">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <List size={18} />
          </button>
          <p className="flex-1 text-sm font-medium text-foreground truncate">
            {selected ? (selected.titulo || `Capítulo ${selected.numero}`) : story.title}
          </p>
        </header>

        {/* Editor content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {selected ? (
            <div className="max-w-3xl mx-auto">
              <ChapterEditorPanel
                key={selected.id}
                capitulo={selected as Capitulo}
                userId={userId}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <List size={28} className="text-primary/60" />
              </div>
              <div>
                <p className="text-lg font-display font-semibold text-foreground mb-1">
                  {capitulos.length === 0 ? 'Empieza tu historia' : 'Selecciona un capítulo'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {capitulos.length === 0
                    ? 'Crea tu primer capítulo con el botón de la izquierda'
                    : 'Elige un capítulo del panel lateral para editarlo'}
                </p>
              </div>
              {capitulos.length === 0 && (
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="btn-primary text-sm"
                >
                  Crear primer capítulo
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
