'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { BookOpen, Check, Clock, Loader2, Send, Save, Trash2, RotateCcw } from 'lucide-react';
import type { Capitulo } from '@/lib/stories/types';
import ChapterRichEditor from './ChapterRichEditor';

interface Props {
  capitulo: Capitulo;
  userId: string;
  onUpdated: (updated: Capitulo) => void;
  onDeleted: (id: string) => void;
}

type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

function wordCount(html: string) {
  return html.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}

function readingMinutes(html: string) {
  return Math.max(1, Math.ceil(wordCount(html) / 200));
}

function SaveBadge({ status }: { status: SaveStatus }) {
  if (status === 'saving') return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Loader2 size={11} className="animate-spin" /> Guardando…
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
  const [publishing, setPublishing] = useState(false);
  const autosaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track unsaved changes to drive autosave backup
  const pendingRef = useRef<{ titulo: string; cuerpo: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    setTitulo(capitulo.titulo);
    setCuerpo(capitulo.cuerpo);
    setEstado((capitulo as any).estado === 'publicado' ? 'publicado' : 'draft');
    setSaveStatus('idle');
    pendingRef.current = null;
    if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
  }, [capitulo.id]);

  // Autosave backup every 30s — never fires if there's nothing unsaved
  useEffect(() => {
    return () => {
      if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
    };
  }, []);

  const scheduleAutosave = useCallback((t: string, c: string) => {
    pendingRef.current = { titulo: t, cuerpo: c };
    if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
    autosaveTimeout.current = setTimeout(async () => {
      if (!pendingRef.current) return;
      const { titulo: pt, cuerpo: pc } = pendingRef.current;
      setSaveStatus('saving');
      const { error } = await supabase
        .from('historia_capitulos')
        .update({ titulo: pt.trim(), cuerpo_html: pc })
        .eq('id', capitulo.id);
      if (!error) {
        pendingRef.current = null;
        setSaveStatus('saved');
        onUpdated({ ...capitulo, titulo: pt.trim(), cuerpo: pc, extracto: '' });
      }
    }, 30_000);
  }, [capitulo, supabase, onUpdated]);

  const handleTituloChange = (val: string) => {
    setTitulo(val);
    setSaveStatus('unsaved');
    scheduleAutosave(val, cuerpo);
  };

  const handleCuerpoChange = (val: string) => {
    setCuerpo(val);
    setSaveStatus('unsaved');
    scheduleAutosave(titulo, val);
  };

  // ── Manual save ───────────────────────────────────────────────────────────────
  const handleSaveDraft = useCallback(async () => {
    if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
    pendingRef.current = null;
    setSaveStatus('saving');
    const { error } = await supabase
      .from('historia_capitulos')
      .update({ titulo: titulo.trim(), cuerpo_html: cuerpo, estado: 'draft' })
      .eq('id', capitulo.id);
    if (error) {
      setSaveStatus('error');
      toast.error('Error al guardar: ' + error.message);
    } else {
      setSaveStatus('saved');
      setEstado('draft');
      toast.success('Cambios guardados');
      onUpdated({ ...capitulo, titulo: titulo.trim(), cuerpo, extracto: '' });
    }
  }, [titulo, cuerpo, capitulo, supabase, onUpdated]);

  // ── Publish ───────────────────────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    if (!titulo.trim()) { toast.error('El capítulo necesita un título'); return; }
    if (wordCount(cuerpo) < 10) { toast.error('El capítulo necesita contenido'); return; }

    setPublishing(true);
    if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
    pendingRef.current = null;

    const { error } = await supabase
      .from('historia_capitulos')
      .update({
        titulo: titulo.trim(),
        cuerpo_html: cuerpo,
        estado: 'publicado',
        published_at: new Date().toISOString(),
      })
      .eq('id', capitulo.id);

    setPublishing(false);
    if (error) {
      toast.error('Error al publicar: ' + error.message);
    } else {
      setSaveStatus('saved');
      setEstado('publicado');
      toast.success('Capítulo publicado');
      onUpdated({ ...capitulo, titulo: titulo.trim(), cuerpo, extracto: '' });
    }
  }, [titulo, cuerpo, capitulo, supabase, onUpdated]);

  // ── Unpublish ─────────────────────────────────────────────────────────────────
  const handleUnpublish = useCallback(async () => {
    const { error } = await supabase
      .from('historia_capitulos')
      .update({ estado: 'draft', published_at: null })
      .eq('id', capitulo.id);
    if (error) {
      toast.error('Error: ' + error.message);
    } else {
      setEstado('draft');
      toast.success('Capítulo movido a borrador');
      onUpdated({ ...capitulo, titulo, cuerpo, extracto: '' });
    }
  }, [titulo, cuerpo, capitulo, supabase, onUpdated]);

  // ── Delete ────────────────────────────────────────────────────────────────────
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

  const isPublished = estado === 'publicado';
  const hasUnsaved = saveStatus === 'unsaved';

  return (
    <div className="flex flex-col gap-4">
      {/* Chapter label + status badge */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-primary uppercase tracking-widest">
          Editando capítulo {capitulo.numero}
        </p>
        <div className="flex items-center gap-2">
          <SaveBadge status={saveStatus} />
          {isPublished ? (
            <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
              ✓ Publicado
            </span>
          ) : (
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted/30 text-muted-foreground border border-border font-medium">
              ○ Borrador
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        value={titulo}
        onChange={(e) => handleTituloChange(e.target.value)}
        placeholder="Título del capítulo"
        className="w-full bg-transparent text-2xl font-display font-bold text-foreground placeholder-muted-foreground/40 border-none outline-none focus:ring-0"
      />

      {/* Editor */}
      <ChapterRichEditor
        value={cuerpo}
        onChange={handleCuerpoChange}
        userId={userId}
        placeholder="Escribe el contenido del capítulo… Arrastra imágenes o usa el botón 🖼"
        minHeight={480}
      />

      {/* Bottom bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-border">
        {/* Meta */}
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <BookOpen size={11} /> {readingMinutes(cuerpo)} min
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={11} /> {wordCount(cuerpo)} palabras
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Delete */}
          <button
            onClick={handleDelete}
            className="p-1.5 text-muted-foreground hover:text-rose-400 hover:bg-rose-400/10 rounded-md transition-colors"
            title="Eliminar capítulo"
          >
            <Trash2 size={13} />
          </button>

          {isPublished ? (
            /* Unpublish */
            <button
              onClick={handleUnpublish}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border text-muted-foreground hover:text-foreground hover:border-border/80 rounded-lg transition-all"
            >
              <RotateCcw size={11} /> Despublicar
            </button>
          ) : (
            <>
              {/* Save draft */}
              <button
                onClick={handleSaveDraft}
                disabled={saveStatus === 'saving'}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 rounded-lg transition-all disabled:opacity-50"
              >
                <Save size={11} /> Guardar cambios
              </button>

              {/* Publish */}
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-primary text-noir font-semibold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {publishing
                  ? <><Loader2 size={11} className="animate-spin" /> Publicando…</>
                  : <><Send size={11} /> Publicar capítulo</>
                }
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
