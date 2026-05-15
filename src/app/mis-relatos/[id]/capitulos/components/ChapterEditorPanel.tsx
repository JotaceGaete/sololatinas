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
  storyId?: string;
  isInitial?: boolean;
  onUpdated: (updated: Capitulo) => void;
  onDeleted: (id: string) => void;
}

type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

function wordCount(html: string) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function readingMinutes(html: string) {
  return Math.max(1, Math.ceil(wordCount(html) / 200));
}

function SaveBadge({ status }: { status: SaveStatus }) {
  if (status === 'saving')
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 size={11} className="animate-spin" /> Guardando…
      </span>
    );
  if (status === 'saved')
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-400">
        <Check size={11} /> Guardado
      </span>
    );
  if (status === 'error') return <span className="text-xs text-rose-400">Error al guardar</span>;
  if (status === 'unsaved') return <span className="text-xs text-amber-400/70">Sin guardar</span>;
  return null;
}

export default function ChapterEditorPanel({
  capitulo,
  userId,
  storyId,
  isInitial = false,
  onUpdated,
  onDeleted,
}: Props) {
  const [titulo, setTitulo] = useState(capitulo.titulo);
  const [cuerpo, setCuerpo] = useState(capitulo.cuerpo);
  const [estado, setEstado] = useState<'draft' | 'publicado'>(
    (capitulo as any).estado === 'publicado' ? 'publicado' : 'draft'
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [publishing, setPublishing] = useState(false);
  const autosaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ titulo: string; cuerpo: string } | null>(null);
  // Always-current refs — never stale inside useCallback closures
  const cuerpoRef = useRef(cuerpo);
  const tituloRef = useRef(titulo);
  const supabase = createClient();

  useEffect(() => {
    setTitulo(capitulo.titulo);
    setCuerpo(capitulo.cuerpo);
    cuerpoRef.current = capitulo.cuerpo;
    tituloRef.current = capitulo.titulo;
    setEstado((capitulo as any).estado === 'publicado' ? 'publicado' : 'draft');
    setSaveStatus('idle');
    pendingRef.current = null;
    if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
  }, [capitulo.id]);

  useEffect(() => {
    return () => {
      if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
    };
  }, []);

  const scheduleAutosave = useCallback(
    (t: string, c: string) => {
      pendingRef.current = { titulo: t, cuerpo: c };
      if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
      autosaveTimeout.current = setTimeout(async () => {
        if (!pendingRef.current) return;
        const { titulo: pt, cuerpo: pc } = pendingRef.current;
        setSaveStatus('saving');
        const { error } = isInitial
          ? await supabase
              .from('relatos')
              .update({
                title: pt.trim() || capitulo.titulo,
                titulo: pt.trim() || capitulo.titulo,
                content: pc,
                cuerpo: pc,
              })
              .eq('id', storyId ?? capitulo.relatoId)
          : await supabase
              .from('historia_capitulos')
              .update({ titulo: pt.trim(), cuerpo_html: pc })
              .eq('id', capitulo.id);
        if (!error) {
          pendingRef.current = null;
          setSaveStatus('saved');
          onUpdated({ ...capitulo, titulo: pt.trim(), cuerpo: pc, extracto: '' });
        }
      }, 30_000);
    },
    [capitulo, isInitial, storyId, supabase, onUpdated]
  );

  const handleTituloChange = (val: string) => {
    tituloRef.current = val;
    setTitulo(val);
    setSaveStatus('unsaved');
    scheduleAutosave(val, cuerpoRef.current);
  };

  const handleCuerpoChange = (val: string) => {
    // Update ref synchronously — ensures save operations always see the latest value
    // even if they fire before the React re-render propagates the new state
    cuerpoRef.current = val;
    setCuerpo(val);
    setSaveStatus('unsaved');
    scheduleAutosave(tituloRef.current, val);
  };

  // ── Manual save ───────────────────────────────────────────────────────────────
  const handleSaveDraft = useCallback(async () => {
    if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
    pendingRef.current = null;
    setSaveStatus('saving');

    const currentTitulo = tituloRef.current.trim();
    const currentCuerpo = cuerpoRef.current;
    console.log('[save chapter] has ch-media-block:', currentCuerpo.includes('ch-media-block'));
    console.log('[save chapter] cuerpo_html snippet:', currentCuerpo.slice(0, 300));

    const { error } = isInitial
      ? await supabase
          .from('relatos')
          .update({
            title: currentTitulo || capitulo.titulo,
            titulo: currentTitulo || capitulo.titulo,
            content: currentCuerpo,
            cuerpo: currentCuerpo,
            lectura_minutos: readingMinutes(currentCuerpo),
            tiempo_lectura: readingMinutes(currentCuerpo),
          })
          .eq('id', storyId ?? capitulo.relatoId)
      : await supabase
          .from('historia_capitulos')
          .update({ titulo: currentTitulo, cuerpo_html: currentCuerpo, estado: 'draft' })
          .eq('id', capitulo.id);
    if (error) {
      setSaveStatus('error');
      toast.error('Error al guardar: ' + error.message);
    } else {
      setSaveStatus('saved');
      if (!isInitial) setEstado('draft');
      toast.success('Cambios guardados');
      onUpdated({ ...capitulo, titulo: currentTitulo, cuerpo: currentCuerpo, extracto: '' });
    }
  }, [capitulo, isInitial, storyId, supabase, onUpdated]);

  // ── Publish ───────────────────────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    if (isInitial) {
      await handleSaveDraft();
      toast.info('El contenido inicial se publica junto con el estado del relato.');
      return;
    }
    const currentTitulo = tituloRef.current.trim();
    const currentCuerpo = cuerpoRef.current;
    if (!currentTitulo) {
      toast.error('El capítulo necesita un título');
      return;
    }
    if (wordCount(currentCuerpo) < 10) {
      toast.error('El capítulo necesita contenido');
      return;
    }

    setPublishing(true);
    if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
    pendingRef.current = null;

    const { error } = await supabase
      .from('historia_capitulos')
      .update({
        titulo: currentTitulo,
        cuerpo_html: currentCuerpo,
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
      onUpdated({ ...capitulo, titulo: currentTitulo, cuerpo: currentCuerpo, extracto: '' });
    }
  }, [capitulo, handleSaveDraft, isInitial, supabase, onUpdated]);

  // ── Unpublish ─────────────────────────────────────────────────────────────────
  const handleUnpublish = useCallback(async () => {
    if (isInitial) {
      toast.info('El contenido inicial usa el estado de publicación del relato.');
      return;
    }
    const { error } = await supabase
      .from('historia_capitulos')
      .update({ estado: 'draft', published_at: null })
      .eq('id', capitulo.id);
    if (error) {
      toast.error('Error: ' + error.message);
    } else {
      setEstado('draft');
      toast.success('Capítulo movido a borrador');
      onUpdated({
        ...capitulo,
        titulo: tituloRef.current,
        cuerpo: cuerpoRef.current,
        extracto: '',
      });
    }
  }, [capitulo, isInitial, supabase, onUpdated]);

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (isInitial) {
      toast.error('El contenido inicial del relato no se elimina desde capítulos.');
      return;
    }
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
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <BookOpen size={11} /> {readingMinutes(cuerpo)} min
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={11} /> {wordCount(cuerpo)} palabras
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="p-1.5 text-muted-foreground hover:text-rose-400 hover:bg-rose-400/10 rounded-md transition-colors"
            title="Eliminar capítulo"
          >
            <Trash2 size={13} />
          </button>

          {isPublished ? (
            <button
              onClick={handleUnpublish}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border text-muted-foreground hover:text-foreground hover:border-border/80 rounded-lg transition-all"
            >
              <RotateCcw size={11} /> Despublicar
            </button>
          ) : (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={saveStatus === 'saving'}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 rounded-lg transition-all disabled:opacity-50"
              >
                <Save size={11} /> Guardar cambios
              </button>

              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-primary text-noir font-semibold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {publishing ? (
                  <>
                    <Loader2 size={11} className="animate-spin" /> Publicando…
                  </>
                ) : (
                  <>
                    <Send size={11} /> Publicar capítulo
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
