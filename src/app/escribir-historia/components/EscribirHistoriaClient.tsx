'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import RichTextEditor from '@/app/escribir-relato/components/RichTextEditor';
import {
  BookOpen, ChevronRight, Plus, Save, Send,
  ArrowLeft, Hash, FileText, ImagePlus, X,
} from 'lucide-react';
import type { Historia, HistoriaCapitulo } from '@/types/historias';

// ─── Steps ───────────────────────────────────────────────────────────────────

type Step = 'obra' | 'capitulo';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ObraForm {
  titulo: string;
  descripcion: string;
  portada_url: string;
}

interface CapituloForm {
  titulo: string;
  cuerpo_html: string;
}

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepBar({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'obra', label: 'Obra principal' },
    { key: 'capitulo', label: 'Primer capítulo' },
  ];
  const idx = steps.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-2 mb-10">
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                i <= idx
                  ? 'bg-primary text-noir'
                  : 'bg-surface border border-border text-muted-foreground'
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm ${
                i === idx ? 'text-foreground font-medium' : 'text-muted-foreground'
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight size={14} className="text-muted-foreground/40 flex-shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EscribirHistoriaClient() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [step, setStep] = useState<Step>('obra');
  const [historia, setHistoria] = useState<Historia | null>(null);
  const [capitulos, setCapitulos] = useState<HistoriaCapitulo[]>([]);

  const [obraForm, setObraForm] = useState<ObraForm>({
    titulo: '',
    descripcion: '',
    portada_url: '',
  });

  const [capForm, setCapForm] = useState<CapituloForm>({
    titulo: '',
    cuerpo_html: '',
  });

  const [saving, setSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const updateObra = useCallback(<K extends keyof ObraForm>(k: K, v: ObraForm[K]) => {
    setObraForm((p) => ({ ...p, [k]: v }));
  }, []);

  const handleBodyChange = useCallback((html: string) => {
    setCapForm((p) => ({ ...p, cuerpo_html: html }));
    const words = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  }, []);

  // ── Save obra principal ──────────────────────────────────────────────────

  const handleSaveObra = async (asDraft: boolean) => {
    if (!user) { toast.error('Inicia sesión para continuar'); return; }
    if (!obraForm.titulo.trim()) { toast.error('El título es obligatorio'); return; }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('historias')
        .insert({
          titulo: obraForm.titulo.trim(),
          descripcion: obraForm.descripcion.trim(),
          portada_url: obraForm.portada_url.trim() || null,
          autor_id: user.id,
          estado: 'draft',
        })
        .select()
        .single();

      if (error) { toast.error('Error al guardar: ' + error.message); return; }
      setHistoria(data as Historia);
      toast.success(asDraft ? 'Obra guardada como borrador' : 'Obra creada. Ahora escribe el primer capítulo.');
      if (!asDraft) setStep('capitulo');
    } catch (e: any) {
      toast.error('Error inesperado: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Save capítulo ─────────────────────────────────────────────────────────

  const handleSaveCapitulo = async (publish: boolean) => {
    if (!historia) { toast.error('Primero guarda la obra principal'); return; }
    if (!capForm.titulo.trim()) { toast.error('El título del capítulo es obligatorio'); return; }
    if (!capForm.cuerpo_html || capForm.cuerpo_html.replace(/<[^>]+>/g, '').trim().length < 50) {
      toast.error('El capítulo debe tener al menos 50 caracteres');
      return;
    }

    setSaving(true);
    try {
      const nextNumero = capitulos.length + 1;
      const { data, error } = await supabase
        .from('historia_capitulos')
        .insert({
          historia_id: historia.id,
          numero: nextNumero,
          titulo: capForm.titulo.trim(),
          cuerpo_html: capForm.cuerpo_html,
          estado: publish ? 'revision' : 'draft',
          published_at: publish ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) { toast.error('Error al guardar capítulo: ' + error.message); return; }
      setCapitulos((prev) => [...prev, data as HistoriaCapitulo]);
      setCapForm({ titulo: '', cuerpo_html: '' });
      setWordCount(0);
      toast.success(
        publish
          ? `Capítulo ${nextNumero} enviado a moderación`
          : `Capítulo ${nextNumero} guardado como borrador`
      );
    } catch (e: any) {
      toast.error('Error inesperado: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Nav back */}
      <button
        onClick={() => router.push('/escribir-relato')}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft size={12} />
        Cambiar formato
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 text-accent/70 text-sm font-medium mb-3">
          <BookOpen size={16} />
          <span>Historia por capítulos</span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-gradient-gold mb-2">
          {historia ? historia.titulo : 'Nueva Historia'}
        </h1>
        {historia && (
          <p className="text-xs text-muted-foreground">
            {capitulos.length} {capitulos.length === 1 ? 'capítulo' : 'capítulos'} guardados
          </p>
        )}
      </div>

      <StepBar current={step} />

      {/* ── STEP 1: Obra principal ── */}
      {step === 'obra' && (
        <div className="space-y-6">
          <section className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Título de la obra <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={obraForm.titulo}
              onChange={(e) => updateObra('titulo', e.target.value)}
              placeholder="El nombre de tu historia..."
              maxLength={120}
              className="w-full bg-surface border border-border rounded-xl px-5 py-4 font-display text-2xl text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/60 transition-colors"
            />
          </section>

          <section className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Descripción / sinopsis
            </label>
            <textarea
              value={obraForm.descripcion}
              onChange={(e) => updateObra('descripcion', e.target.value)}
              placeholder="De qué trata tu historia, en qué país se ambienta, quiénes son los personajes principales..."
              rows={4}
              maxLength={600}
              className="w-full bg-surface border border-border rounded-xl px-5 py-4 text-foreground font-serif text-base leading-relaxed placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/60 transition-colors resize-none"
            />
            <div className="flex justify-end">
              <span className="text-xs text-muted-foreground/50">{obraForm.descripcion.length}/600</span>
            </div>
          </section>

          <section className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <ImagePlus size={14} />
              URL de portada
              <span className="normal-case font-normal text-muted-foreground/50">(opcional — puedes subirla después)</span>
            </label>
            <input
              type="url"
              value={obraForm.portada_url}
              onChange={(e) => updateObra('portada_url', e.target.value)}
              placeholder="https://..."
              className="w-full bg-surface border border-border rounded-xl px-5 py-3.5 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/60 transition-colors"
            />
          </section>

          {/* Capítulos existentes (si ya guardó la obra y volvió) */}
          {historia && capitulos.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText size={14} />
                Capítulos
              </h3>
              <div className="space-y-2">
                {capitulos.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface text-sm">
                    <Hash size={12} className="text-muted-foreground" />
                    <span className="text-muted-foreground">{c.numero}.</span>
                    <span className="text-foreground font-medium flex-1">{c.titulo}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      c.estado === 'publicado'
                        ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}>
                      {c.estado}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
            {!historia ? (
              <>
                <button
                  onClick={() => handleSaveObra(true)}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-primary/40 text-primary hover:bg-primary/10 transition-all disabled:opacity-50"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" /> : <Save size={18} />}
                  Guardar borrador
                </button>
                <button
                  onClick={() => handleSaveObra(false)}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-noir font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-noir/40 border-t-noir rounded-full animate-spin" /> : <Plus size={18} />}
                  Crear y añadir capítulo
                </button>
              </>
            ) : (
              <button
                onClick={() => setStep('capitulo')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-noir font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                <Plus size={18} />
                {capitulos.length === 0 ? 'Escribir primer capítulo' : `Añadir capítulo ${capitulos.length + 1}`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 2: Capítulo ── */}
      {step === 'capitulo' && historia && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border text-sm">
            <BookOpen size={16} className="text-accent flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Obra</p>
              <p className="font-medium text-foreground truncate">{historia.titulo}</p>
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              Cap. {capitulos.length + 1}
            </span>
          </div>

          <section className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Título del capítulo <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={capForm.titulo}
              onChange={(e) => setCapForm((p) => ({ ...p, titulo: e.target.value }))}
              placeholder={`Capítulo ${capitulos.length + 1}: ...`}
              maxLength={120}
              className="w-full bg-surface border border-border rounded-xl px-5 py-4 font-display text-xl text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/60 transition-colors"
            />
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Cuerpo del capítulo <span className="text-primary">*</span>
              </label>
              <span className="text-xs text-muted-foreground/60">{wordCount.toLocaleString()} palabras</span>
            </div>
            <RichTextEditor
              value={capForm.cuerpo_html}
              onChange={handleBodyChange}
              placeholder="Escribe el contenido de este capítulo..."
            />
          </section>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
            <button
              onClick={() => setStep('obra')}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-all text-sm"
            >
              <ArrowLeft size={16} />
              Ver obra
            </button>

            <button
              onClick={() => handleSaveCapitulo(false)}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-primary/40 text-primary hover:bg-primary/10 transition-all disabled:opacity-50"
            >
              {saving ? <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" /> : <Save size={18} />}
              Guardar borrador
            </button>

            <button
              onClick={() => handleSaveCapitulo(true)}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-noir font-semibold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {saving ? <div className="w-4 h-4 border-2 border-noir/40 border-t-noir rounded-full animate-spin" /> : <Send size={18} />}
              Enviar a revisión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
