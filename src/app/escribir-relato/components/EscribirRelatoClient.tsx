'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import RichTextEditor from './RichTextEditor';
import PreviewModal from './PreviewModal';
import FormatSelector, { type FormatoCreacion } from './FormatSelector';
import {
  PenLine, ImagePlus, Tags, Globe, BookOpen,
  Sparkles, Eye, Save, Send, X, ChevronDown, ArrowLeft
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const SUGGESTED_TAGS = [
  'colombiana', 'mexicana', 'argentina', 'venezolana', 'chilena', 'brasileña',
  'española', 'peruana', 'cubana', 'dominicana',
  'pasión', 'romance', 'amor', 'deseo', 'intimidad', 'encuentro',
  'noche', 'verano', 'lluvia', 'viaje', 'secreto', 'prohibido',
  'cartas', 'baile', 'salsa', 'tango', 'flamenco', 'música',
  'intenso', 'dulce', 'melancólico', 'apasionado', 'tierno', 'ardiente',
];

const COUNTRIES = [
  'Colombia', 'México', 'Argentina', 'Venezuela', 'Chile', 'Brasil',
  'España', 'Perú', 'Cuba', 'República Dominicana', 'Ecuador', 'Bolivia',
  'Paraguay', 'Uruguay', 'Costa Rica', 'Panamá', 'Guatemala', 'Honduras',
  'El Salvador', 'Nicaragua', 'Puerto Rico', 'Otro',
];

const CATEGORIES = [
  'Romance', 'Romance Literario', 'Romance Erótico', 'Drama Romántico',
  'Amor y Pérdida', 'Encuentros', 'Cartas de Amor', 'Poesía Narrativa',
  'Fantasía Romántica', 'Suspenso Romántico', 'Comedia Romántica', 'Otro',
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  titulo: string;
  cuerpo: string;
  extracto: string;
  tags: string[];
  pais: string;
  categoria: string;
  generarImagenIA: boolean;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EscribirRelatoClient() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    titulo: '',
    cuerpo: '',
    extracto: '',
    tags: [],
    pais: '',
    categoria: '',
    generarImagenIA: false,
  });

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [formato, setFormato] = useState<FormatoCreacion | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [r2Ready, setR2Ready] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/upload')
      .then((r) => r.json())
      .then((json) => {
        setR2Ready(json.ok);
        if (!json.ok) {
          const missing = Object.entries(json.vars as Record<string, boolean>)
            .filter(([, v]) => !v)
            .map(([k]) => k)
            .join(', ');
          console.warn('RELATO_UPLOAD_R2_NOT_CONFIGURED', { missing, vars: json.vars });
        }
      })
      .catch(() => setR2Ready(false));
  }, []);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const updateField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleBodyChange = useCallback((html: string) => {
    updateField('cuerpo', html);
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = text ? text.split(' ').filter(w => w.length > 0).length : 0;
    setWordCount(words);
  }, [updateField]);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5MB');
      return;
    }
    setCoverImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleTagInput = useCallback((val: string) => {
    setTagInput(val);
    if (val.length > 0) {
      const filtered = SUGGESTED_TAGS.filter(
        t => t.toLowerCase().includes(val.toLowerCase()) && !form.tags.includes(t)
      );
      setTagSuggestions(filtered.slice(0, 8));
      setShowTagDropdown(true);
    } else {
      setShowTagDropdown(false);
    }
  }, [form.tags]);

  const addTag = useCallback((tag: string) => {
    const clean = tag.replace(/^#/, '').trim().toLowerCase();
    if (!clean || form.tags.includes(clean) || form.tags.length >= 10) return;
    updateField('tags', [...form.tags, clean]);
    setTagInput('');
    setShowTagDropdown(false);
  }, [form.tags, updateField]);

  const removeTag = useCallback((tag: string) => {
    updateField('tags', form.tags.filter(t => t !== tag));
  }, [form.tags, updateField]);

  const handleTagKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
    }
    if (e.key === 'Backspace' && !tagInput && form.tags.length > 0) {
      removeTag(form.tags[form.tags.length - 1]);
    }
  }, [tagInput, form.tags, addTag, removeTag]);

  // ─── Submit helpers ──────────────────────────────────────────────────────────

  const uploadCoverImage = async (): Promise<string> => {
    if (!coverImage) return '';
    setUploadError(null);
    const fd = new FormData();
    fd.append('file', coverImage);
    let res: Response;
    try {
      res = await fetch('/api/upload', { method: 'POST', body: fd });
    } catch (err: any) {
      const msg = 'No se pudo conectar con el servidor de imágenes';
      console.log('RELATO_UPLOAD_IMAGE', { fileName: coverImage.name, publicUrl: null, error: err?.message });
      setUploadError(msg);
      toast.error(msg);
      return '';
    }
    let json: Record<string, unknown>;
    try {
      json = await res.json();
    } catch {
      const msg = `Error del servidor (status ${res.status})`;
      console.log('RELATO_UPLOAD_IMAGE', { fileName: coverImage.name, publicUrl: null, error: msg });
      setUploadError(msg);
      toast.error('Error al subir imagen: ' + msg);
      return '';
    }
    if (!res.ok || !json.url) {
      const msg = (json.error as string) ?? `Error ${res.status}`;
      console.log('RELATO_UPLOAD_IMAGE', { fileName: coverImage.name, publicUrl: null, error: msg });
      setUploadError(msg);
      toast.error('Error al subir imagen: ' + msg);
      return '';
    }
    const publicUrl = json.url as string;
    console.log('RELATO_UPLOAD_IMAGE', { fileName: coverImage.name, publicUrl, error: null });
    return publicUrl;
  };

  const calcReadingTime = (html: string): number => {
    const text = html.replace(/<[^>]*>/g, ' ').trim();
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  const validate = (): string | null => {
    if (!form.titulo.trim()) return 'El título es obligatorio';
    if (!form.cuerpo || form.cuerpo.replace(/<[^>]*>/g, '').trim().length < 50)
      return 'El relato debe tener al menos 50 caracteres';
    return null;
  };

  const handleSaveDraft = async () => {
    if (!user) { toast.error('Debes iniciar sesión para guardar'); router.push('/sign-up-login-screen'); return; }
    const err = validate();
    if (err) { toast.error(err); return; }
    setSaving(true);
    try {
      const imagenUrl = await uploadCoverImage();
      if (coverImage && !imagenUrl) return;
      const { error } = await supabase.from('relatos').insert({
        titulo: form.titulo.trim(),
        cuerpo: form.cuerpo,
        extracto: form.extracto.trim(),
        tags: form.tags,
        pais: form.pais,
        categoria: form.categoria,
        autor_id: user.id,
        estado: 'borrador',
        imagen_url: imagenUrl || null,
        portada_url: imagenUrl || null,
        cover_image_url: imagenUrl || null,
        generar_imagen_ia: form.generarImagenIA,
        tiempo_lectura: calcReadingTime(form.cuerpo),
      });
      if (error) { toast.error('Error al guardar: ' + error.message); return; }
      toast.success('Borrador guardado correctamente');
    } catch (e: any) {
      toast.error('Error inesperado: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!user) { toast.error('Debes iniciar sesión para publicar'); router.push('/sign-up-login-screen'); return; }
    const err = validate();
    if (err) { toast.error(err); return; }
    if (!form.extracto.trim()) { toast.error('El extracto es obligatorio para publicar'); return; }
    setPublishing(true);
    try {
      const imagenUrl = await uploadCoverImage();
      if (coverImage && !imagenUrl) return;
      const { error } = await supabase.from('relatos').insert({
        titulo: form.titulo.trim(),
        cuerpo: form.cuerpo,
        extracto: form.extracto.trim(),
        tags: form.tags,
        pais: form.pais,
        categoria: form.categoria,
        autor_id: user.id,
        estado: 'revision',
        imagen_url: imagenUrl || null,
        portada_url: imagenUrl || null,
        cover_image_url: imagenUrl || null,
        generar_imagen_ia: form.generarImagenIA,
        tiempo_lectura: calcReadingTime(form.cuerpo),
        published_at: new Date().toISOString(),
      });
      if (error) { toast.error('Error al publicar: ' + error.message); return; }
      toast.success('¡Relato enviado a moderación! Te notificaremos cuando sea aprobado.');
      setTimeout(() => router.push('/stories-library'), 2000);
    } catch (e: any) {
      toast.error('Error inesperado: ' + e.message);
    } finally {
      setPublishing(false);
    }
  };

  const readingTime = calcReadingTime(form.cuerpo);

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (!formato) {
    return (
      <FormatSelector
        onSelect={(f) => {
          if (f === 'historia') {
            router.push('/escribir-historia');
          } else {
            setFormato(f);
          }
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Page Header */}
      <div className="mb-10 text-center">
        <button
          onClick={() => setFormato(null)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={12} />
          Cambiar formato
        </button>
        <div className="inline-flex items-center gap-2 text-primary/70 text-sm font-medium mb-3">
          <PenLine size={16} />
          <span>Relato corto</span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-gradient-gold mb-3">
          Escribe tu Relato
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Comparte tu historia con nuestra comunidad de lectores latinos. Cada relato es una ventana al alma.
        </p>
      </div>

      {/* ── R2 config warning ── */}
      {r2Ready === false && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          <span className="mt-0.5 text-base">⚠️</span>
          <div>
            <p className="font-semibold">Subida de imágenes no disponible</p>
            <p className="text-amber-300/70 mt-0.5">
              Las variables R2 no están configuradas en el servidor. Las imágenes no se guardarán.
              Verifica R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET y R2_PUBLIC_URL en .env.local.
            </p>
          </div>
        </div>
      )}

      {/* ── Upload error banner ── */}
      {uploadError && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <span className="mt-0.5 text-base">✕</span>
          <div className="flex-1">
            <p className="font-semibold">Error al subir imagen</p>
            <p className="text-red-300/70 mt-0.5 font-mono text-xs">{uploadError}</p>
          </div>
          <button onClick={() => setUploadError(null)} className="text-red-300/60 hover:text-red-300 transition-colors text-lg leading-none">×</button>
        </div>
      )}

      <div className="space-y-8">
        {/* ── Título ── */}
        <section className="space-y-2">
          <label className="block text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Título del Relato <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            value={form.titulo}
            onChange={e => updateField('titulo', e.target.value)}
            placeholder="Un título que despierte la curiosidad..."
            maxLength={120}
            className="w-full bg-surface border border-border rounded-xl px-5 py-4 font-display text-2xl md:text-3xl text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/60 transition-colors"
          />
          <div className="flex justify-end">
            <span className="text-xs text-muted-foreground/50">{form.titulo.length}/120</span>
          </div>
        </section>

        {/* ── Editor de texto ── */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Cuerpo del Relato <span className="text-primary">*</span>
            </label>
            <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
              <span>{wordCount.toLocaleString()} palabras</span>
              <span>·</span>
              <span>~{readingTime} min lectura</span>
            </div>
          </div>
          <RichTextEditor
            value={form.cuerpo}
            onChange={handleBodyChange}
            placeholder="Comienza tu historia aquí. Escribe con libertad, sin límites..."
          />
        </section>

        {/* ── Extracto ── */}
        <section className="space-y-2">
          <label className="block text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Extracto <span className="text-muted-foreground/50 normal-case font-normal">(vista previa gratuita)</span>
          </label>
          <textarea
            value={form.extracto}
            onChange={e => updateField('extracto', e.target.value)}
            placeholder="Un fragmento irresistible que invite a leer el relato completo..."
            rows={4}
            maxLength={400}
            className="w-full bg-surface border border-border rounded-xl px-5 py-4 text-foreground font-serif text-base leading-relaxed placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/60 transition-colors resize-none"
          />
          <div className="flex justify-end">
            <span className="text-xs text-muted-foreground/50">{form.extracto.length}/400</span>
          </div>
        </section>

        {/* ── Tags ── */}
        <section className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
            <Tags size={14} />
            Etiquetas
            <span className="text-muted-foreground/50 normal-case font-normal">(máx. 10)</span>
          </label>
          <div className="relative">
            <div className="min-h-[52px] flex flex-wrap gap-2 items-center bg-surface border border-border rounded-xl px-4 py-3 focus-within:border-primary/60 transition-colors cursor-text"
              onClick={() => document.getElementById('tag-input')?.focus()}
            >
              {form.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-primary/15 text-primary text-sm px-3 py-1 rounded-full border border-primary/30">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors ml-0.5">
                    <X size={12} />
                  </button>
                </span>
              ))}
              {form.tags.length < 10 && (
                <input
                  id="tag-input"
                  type="text"
                  value={tagInput}
                  onChange={e => handleTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => setTimeout(() => setShowTagDropdown(false), 150)}
                  placeholder={form.tags.length === 0 ? '#colombiana, #romance, #noche...' : ''}
                  className="flex-1 min-w-[120px] bg-transparent text-foreground text-sm placeholder:text-muted-foreground/30 focus:outline-none"
                />
              )}
            </div>

            {/* Tag suggestions dropdown */}
            {showTagDropdown && tagSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-elevated border border-border rounded-xl shadow-xl z-20 overflow-hidden">
                <div className="p-2">
                  <p className="text-xs text-muted-foreground/50 px-2 py-1 mb-1">Sugerencias</p>
                  <div className="flex flex-wrap gap-1.5 p-1">
                    {tagSuggestions.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onMouseDown={() => addTag(tag)}
                        className="text-xs bg-white/5 hover:bg-primary/15 text-muted-foreground hover:text-primary border border-border hover:border-primary/30 px-3 py-1.5 rounded-full transition-all"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Popular tags quick-add */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-xs text-muted-foreground/40 self-center mr-1">Populares:</span>
            {['colombiana', 'pasión', 'noche', 'romance', 'encuentro', 'amor'].filter(t => !form.tags.includes(t)).slice(0, 6).map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="text-xs text-muted-foreground/50 hover:text-primary border border-border/50 hover:border-primary/30 px-2.5 py-1 rounded-full transition-all hover:bg-primary/5"
              >
                +#{tag}
              </button>
            ))}
          </div>
        </section>

        {/* ── Imagen de portada ── */}
        <section className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
            <ImagePlus size={14} />
            Imagen de Portada
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all overflow-hidden ${
              coverPreview ? 'border-primary/40' : 'border-border hover:border-primary/40'
            }`}
          >
            {coverPreview ? (
              <div className="relative h-56 md:h-72">
                <img src={coverPreview} alt="Vista previa de portada" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="text-white text-center">
                    <ImagePlus size={24} className="mx-auto mb-2" />
                    <p className="text-sm">Cambiar imagen</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setCoverImage(null); setCoverPreview(''); }}
                  className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center gap-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors p-6">
                <ImagePlus size={32} />
                <div className="text-center">
                  <p className="text-sm font-medium">Haz clic para subir una imagen</p>
                  <p className="text-xs mt-1">JPG, PNG, WebP · Máx. 5MB · Recomendado: 1200×800px</p>
                </div>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="hidden"
          />
        </section>

        {/* ── País y Categoría ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <section className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <Globe size={14} />
              País
            </label>
            <div className="relative">
              <select
                value={form.pais}
                onChange={e => updateField('pais', e.target.value)}
                className="w-full appearance-none bg-surface border border-border rounded-xl px-5 py-3.5 text-foreground focus:outline-none focus:border-primary/60 transition-colors cursor-pointer pr-10"
              >
                <option value="">Seleccionar país...</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </section>

          <section className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <BookOpen size={14} />
              Categoría
            </label>
            <div className="relative">
              <select
                value={form.categoria}
                onChange={e => updateField('categoria', e.target.value)}
                className="w-full appearance-none bg-surface border border-border rounded-xl px-5 py-3.5 text-foreground focus:outline-none focus:border-primary/60 transition-colors cursor-pointer pr-10"
              >
                <option value="">Seleccionar categoría...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </section>
        </div>

        {/* ── Generar imagen con IA ── */}
        <section>
          <label className="flex items-start gap-4 cursor-pointer group p-5 rounded-xl border border-border hover:border-primary/30 bg-surface transition-all">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={form.generarImagenIA}
                onChange={e => updateField('generarImagenIA', e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                form.generarImagenIA ? 'bg-primary border-primary' : 'border-border group-hover:border-primary/50'
              }`}>
                {form.generarImagenIA && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-primary" />
                <span className="font-medium text-foreground">Generar imagen con IA según los tags del relato</span>
                <span className="text-xs bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 rounded-full">Próximamente</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Nuestra IA creará una ilustración artística basada en las etiquetas de tu relato. 
                Ejemplo: una escena romántica latina con iluminación cálida y estilo elegante.
              </p>
            </div>
          </label>
        </section>

        {/* ── Action Buttons ── */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            disabled={!form.titulo || !form.cuerpo}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Eye size={18} />
            Vista Previa
          </button>

          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving || publishing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-primary/40 text-primary hover:bg-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {saving ? 'Guardando...' : 'Guardar Borrador'}
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={saving || publishing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-noir font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              {publishing ? (
                <div className="w-4 h-4 border-2 border-noir/40 border-t-noir rounded-full animate-spin" />
              ) : (
                <Send size={18} />
              )}
              {publishing ? 'Publicando...' : 'Publicar Relato'}
            </button>
          </div>
        </div>

        {/* Auth notice */}
        {!user && (
          <div className="text-center py-4 px-6 rounded-xl bg-surface border border-border/50">
            <p className="text-sm text-muted-foreground">
              Necesitas{' '}
              <a href="/sign-up-login-screen" className="text-primary hover:underline">iniciar sesión</a>
              {' '}para guardar o publicar tu relato.
            </p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          titulo={form.titulo}
          cuerpo={form.cuerpo}
          extracto={form.extracto}
          tags={form.tags}
          pais={form.pais}
          categoria={form.categoria}
          coverPreview={coverPreview}
          readingTime={readingTime}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
