'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { BookOpen, Check, Clock, Loader2, Trash2 } from 'lucide-react';
import type { Capitulo } from '@/lib/stories/types';
import ChapterRichEditor from './ChapterRichEditor';

interface Props {
  capitulo: Capitulo;
  userId: string;
  onUpdated: (updated: Capitulo) => void;
  onDeleted: (id: string) => void;
}

type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

function readingMinutes(html: string) {
  const words = html.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'saving') return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Loader2 size={11} className="animate-spin" /> Guardando...
    </span>
  );
  if (status === 'saved') return (
    <span className="flex items-center gap-1 text-xs text-emerald-400">
      <Check size={11} /> Guardado
    </span>
  );
  if (status === 'error') return (
    <span className="text-xs text-rose-400">Error al guardar</span>
  );
  if (status === 'unsaved') return (
    <span className="text-xs text-amber-400/70">Sin guardar</span>
  );
  return null;
}

export default function ChapterEditorPanel({ capitulo, userId, onUpdated, onDeleted }: Props) {
  const [titulo, setTitulo] = useState(capitulo.titulo);
  const [cuerpo, setCuerpo] = useState(capitulo.cuerpo);
  const [estado, setEstado] = useState<'draft' | 'publicado'>(
    (capitulo as any).estado === 'publicado' ? 'publicado' : 'draft'
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  // Reset when chapter changes
  useEffect(() => {
    setTitulo(capitulo.titulo);
    setCuerpo(capitulo.cuerpo);
    setEstado((capitulo as any).estado === 'publicado' ? 'publicado' : 'draft');
    setSaveStatus('idle');
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
  }, [capitulo.id]);

  const scheduleSave = useCallback((t: string, c: string, e: string) => {
    setSaveStatus('unsaved');
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      setSaveStatus('saving');
      const { error } = await supabase
        .from('historia_capitulos')
        .update({ titulo: t.trim(), cuerpo_html: c, estado: e })
        .eq('id', capitulo.id);
      if (error) {
        setSaveStatus('error');
        toast.error('Error al guardar: ' + error.message);
      } else {
        setSaveStatus('saved');
        onUpdated({ ...capitulo, titulo: t.trim(), cuerpo: c, extracto: '' });
      }
    }, 2000);
  }, [capitulo, supabase, onUpdated]);

  const handleTituloChange = (val: string) => {
    setTitulo(val);
    scheduleSave(val, cuerpo, estado);
  };

  const handleCuerpoChange = (val: string) => {
    setCuerpo(val);
    scheduleSave(titulo, val, estado);
  };

  const handleEstadoToggle = async () => {
    const next = estado === 'draft' ? 'publicado' : 'draft';
    setEstado(next);
    const { error } = await supabase
      .from('historia_capitulos')
      .update({ estado: next })
      .eq('id', capitulo.id);
    if (error) {
      toast.error('Error al cambiar estado');
      setEstado(estado);
    } else {
      toast.success(next === 'publicado' ? 'Capítulo publicado' : 'Capítulo movido a borrador');
      onUpdated({ ...capitulo, titulo, cuerpo, extracto: '' });
    }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar el capítulo ${capitulo.numero}? Esta acción es irreversible.`)) return;
    const { error } = await supabase.from('historia_capitulos').delete().eq('id', capitulo.id);
    if (error) {
      toast.error('Error al eliminar: ' + error.message);
    } else {
      toast.success(`Capítulo ${capitulo.numero} eliminado`);
      onDeleted(capitulo.id);
    }
  };

  const readTime = readingMinutes(cuerpo);

  return (
    <div className="flex flex-col h-full">
      {/* Chapter number badge */}
      <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
        Capítulo {capitulo.numero}
      </p>

      {/* Title */}
      <input
        type="text"
        value={titulo}
        onChange={(e) => handleTituloChange(e.target.value)}
        placeholder="Título del capítulo"
        className="w-full bg-transparent text-2xl font-display font-bold text-foreground placeholder-muted-foreground/40 border-none outline-none mb-4 focus:ring-0"
      />

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <ChapterRichEditor
          value={cuerpo}
          onChange={handleCuerpoChange}
          userId={userId}
          placeholder="Escribe el contenido del capítulo... (arrastra imágenes aquí)"
          minHeight={520}
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-border flex-wrap gap-2">
        <div className="flex items-center gap-4">
          {/* Reading time */}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <BookOpen size={11} /> {readTime} min
          </span>
          {/* Word count */}
          <span className="text-xs text-muted-foreground">
            <Clock size={11} className="inline mr-1" />
            {cuerpo.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length} palabras
          </span>
          <SaveIndicator status={saveStatus} />
        </div>

        <div className="flex items-center gap-3">
          {/* Draft / Published toggle */}
          <button
            onClick={handleEstadoToggle}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              estado === 'publicado'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/40 hover:text-primary'
            }`}
          >
            {estado === 'publicado' ? '✓ publicado' : '○ borrador'}
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="p-1.5 text-muted-foreground hover:text-rose-400 transition-colors rounded-md hover:bg-rose-400/10"
            title="Eliminar capítulo"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
