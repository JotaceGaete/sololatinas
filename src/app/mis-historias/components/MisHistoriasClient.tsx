'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import RichTextEditor from '@/app/escribir-relato/components/RichTextEditor';
import ChapterList from '@/components/ui/ChapterList';
import {
  BookOpen, Plus, ChevronDown, ChevronUp, Edit3,
  Loader2, Save, Send, X, Hash, Eye, ExternalLink,
} from 'lucide-react';
import type { Historia, HistoriaCapitulo, HistoriaEstado } from '@/types/historias';

// ─── Types ────────────────────────────────────────────────────────────────────

type HistoriaConCapitulos = Historia & { historia_capitulos: HistoriaCapitulo[] };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const ESTADO_STYLES: Record<HistoriaEstado, string> = {
  draft: 'bg-zinc-400/10 text-zinc-400 border-zinc-400/30',
  revision: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
  publicada: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
  archivada: 'bg-red-400/10 text-red-400 border-red-400/30',
};

const ESTADO_LABELS: Record<HistoriaEstado, string> = {
  draft: 'Borrador',
  revision: 'En revisión',
  publicada: 'Publicada',
  archivada: 'Archivada',
};

// ─── Add-chapter inline form ──────────────────────────────────────────────────

function AgregarCapituloForm({
  historia,
  capitulos,
  onSaved,
  onCancel,
}: {
  historia: Historia;
  capitulos: HistoriaCapitulo[];
  onSaved: (cap: HistoriaCapitulo) => void;
  onCancel: () => void;
}) {
  const supabase = createClient();
  const [titulo, setTitulo] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [saving, setSaving] = useState(false);

  const nextNumero = (capitulos[capitulos.length - 1]?.numero ?? 0) + 1;

  const handleSave = async (publish: boolean) => {
    if (!titulo.trim()) { toast.error('El título es obligatorio'); return; }
    if (cuerpo.replace(/<[^>]+>/g, '').trim().length < 50) {
      toast.error('El capítulo debe tener al menos 50 caracteres');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('historia_capitulos')
        .insert({
          historia_id: historia.id,
          numero: nextNumero,
          titulo: titulo.trim(),
          cuerpo_html: cuerpo,
          estado: publish ? 'revision' : 'draft',
          published_at: publish ? new Date().toISOString() : null,
        })
        .select()
        .single();
      if (error) { toast.error('Error: ' + error.message); return; }
      toast.success(publish ? `Capítulo ${nextNumero} enviado a revisión` : `Capítulo ${nextNumero} guardado`);
      onSaved(data as HistoriaCapitulo);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground flex items-center gap-2">
          <Hash size={14} className="text-primary" />
          Capítulo {nextNumero}
        </span>
        <button onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
          <X size={14} />
        </button>
      </div>

      <input
        type="text"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder={`Capítulo ${nextNumero}: título...`}
        maxLength={120}
        className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors text-sm"
      />

      <RichTextEditor
        value={cuerpo}
        onChange={setCuerpo}
        placeholder="Escribe el contenido de este capítulo..."
      />

      <div className="flex gap-2 justify-end pt-1">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-primary/40 text-primary text-xs hover:bg-primary/10 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          Guardar borrador
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-noir text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          Enviar a revisión
        </button>
      </div>
    </div>
  );
}

// ─── Historia card ────────────────────────────────────────────────────────────

function HistoriaCard({
  historia,
  onUpdated,
}: {
  historia: HistoriaConCapitulos;
  onUpdated: (h: HistoriaConCapitulos) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [addingCap, setAddingCap] = useState(false);

  const handleCapSaved = (cap: HistoriaCapitulo) => {
    onUpdated({
      ...historia,
      historia_capitulos: [...historia.historia_capitulos, cap],
    });
    setAddingCap(false);
  };

  const pubCaps = historia.historia_capitulos.filter((c) => c.estado === 'publicado');
  const allCaps = historia.historia_capitulos;

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-4 p-5">
        {/* Cover thumbnail */}
        <div className="w-14 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-noir border border-border flex items-center justify-center">
          {historia.portada_url?.trim() ? (
            <img src={historia.portada_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <BookOpen size={20} className="text-muted-foreground/40" />
          )}
        </div>

        {/* Meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <h3 className="font-display text-base font-semibold text-foreground leading-snug">
              {historia.titulo}
            </h3>
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ESTADO_STYLES[historia.estado]}`}>
              {ESTADO_LABELS[historia.estado]}
            </span>
          </div>
          {historia.descripcion && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {historia.descripcion}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Hash size={10} />
              {allCaps.length} cap. · {pubCaps.length} publicados
            </span>
            <span className="text-xs text-muted-foreground/60">
              {formatDate(historia.updated_at)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {historia.slug && (
            <Link
              href={`/historia/${historia.slug}`}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
              title="Ver portada pública"
              target="_blank"
            >
              <ExternalLink size={14} />
            </Link>
          )}
          <button
            onClick={() => { setExpanded((v) => !v); setAddingCap(false); }}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            title={expanded ? 'Colapsar' : 'Ver capítulos'}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded: chapter list */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-border/50 pt-4">
          <ChapterList
            capitulos={allCaps}
            historiaSlug={historia.slug ?? ''}
            showStatus
          />

          {!addingCap ? (
            <button
              onClick={() => setAddingCap(true)}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-primary/30 text-primary text-sm hover:bg-primary/5 hover:border-primary/50 transition-all"
            >
              <Plus size={14} />
              Añadir capítulo {allCaps.length + 1}
            </button>
          ) : (
            <AgregarCapituloForm
              historia={historia}
              capitulos={allCaps}
              onSaved={handleCapSaved}
              onCancel={() => setAddingCap(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MisHistoriasClient() {
  const { user, loading: authLoading } = useRequireAuth();
  const supabase = createClient();

  const [historias, setHistorias] = useState<HistoriaConCapitulos[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('historias')
        .select(`*, historia_capitulos(*)`)
        .eq('autor_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setHistorias((data as HistoriaConCapitulos[]) ?? []);
    } catch {
      setHistorias([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleUpdated = useCallback((updated: HistoriaConCapitulos) => {
    setHistorias((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
  }, []);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-medium text-accent/70 uppercase tracking-widest mb-1">
              Panel de escritora
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Mis Historias
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Obras serializadas y sus capítulos
            </p>
          </div>
          <Link
            href="/escribir-historia"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent/20 border border-accent/30 text-accent font-semibold text-sm hover:bg-accent/30 transition-all"
          >
            <Plus size={16} />
            Nueva historia
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-surface border border-border animate-pulse" />
            ))}
          </div>
        ) : historias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-4">
              <BookOpen size={24} className="text-muted-foreground/40" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              Aún no has creado ninguna historia
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              Crea tu primera obra serializada y publica capítulos por entregas.
            </p>
            <Link
              href="/escribir-historia"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent/20 border border-accent/30 text-accent font-semibold text-sm hover:bg-accent/30 transition-all"
            >
              <Plus size={16} />
              Crear primera historia
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {historias.map((h) => (
              <HistoriaCard
                key={h.id}
                historia={h}
                onUpdated={handleUpdated}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
