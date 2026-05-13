'use client';

import React, { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import RichTextEditor from '@/app/escribir-relato/components/RichTextEditor';

const SUGGESTED_TAGS = [
  'romance', 'amor', 'pasión', 'drama', 'erotico', 'aventura',
  'misterio', 'fantasia', 'lgbt', 'amistad', 'familia',
];

const PAISES = [
  'Argentina', 'México', 'Colombia', 'Chile', 'Perú', 'Venezuela',
  'Cuba', 'Ecuador', 'Bolivia', 'Paraguay', 'Uruguay', 'España',
];

const CATEGORIAS = [
  'Romance', 'Erótico', 'Drama', 'Aventura', 'Fantasía',
  'Misterio', 'Humor', 'Histórico', 'LGBT+', 'Poesía Narrativa',
];

interface InitialRelato {
  id: string;
  titulo: string;
  cuerpo: string;
  extracto: string;
  tags: string[];
  pais: string;
  categoria: string;
  imagen_url: string;
  estado: string;
}

interface Props {
  userId: string;
  relato: InitialRelato;
}

function calcReadingTime(html: string) {
  const words = html.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function EditarRelatoClient({ userId, relato }: Props) {
  const router = useRouter();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = () => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [titulo, setTitulo] = useState(relato.titulo);
  const [cuerpo, setCuerpo] = useState(relato.cuerpo);
  const [extracto, setExtracto] = useState(relato.extracto);
  const [tags, setTags] = useState<string[]>(relato.tags);
  const [pais, setPais] = useState(relato.pais);
  const [categoria, setCategoria] = useState(relato.categoria);
  const [existingImageUrl] = useState(relato.imagen_url);
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState(relato.imagen_url);
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [saving, setSaving] = useState(false);

  const uploadCover = async (): Promise<string> => {
    if (!newCoverFile) return existingImageUrl;
    const body = new FormData();
    body.append('file', newCoverFile);
    body.append('userId', userId);
    const res = await fetch('/api/r2/upload', { method: 'POST', body });
    if (!res.ok) throw new Error('Error al subir portada');
    const { publicUrl } = await res.json();
    return publicUrl || existingImageUrl;
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('La imagen no puede superar 5 MB'); return; }
    setNewCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleTagInput = (val: string) => {
    setTagInput(val);
    if (val.length > 0) {
      setTagSuggestions(SUGGESTED_TAGS.filter(
        t => t.toLowerCase().includes(val.toLowerCase()) && !tags.includes(t)
      ).slice(0, 6));
      setShowTagDropdown(true);
    } else {
      setShowTagDropdown(false);
    }
  };

  const addTag = (tag: string) => {
    if (!tags.includes(tag) && tags.length < 8) {
      setTags(prev => [...prev, tag]);
    }
    setTagInput('');
    setShowTagDropdown(false);
  };

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

  const validate = () => {
    if (!titulo.trim()) return 'El título es obligatorio';
    if (cuerpo.replace(/<[^>]*>/g, '').trim().length < 50)
      return 'El relato debe tener al menos 50 caracteres';
    return null;
  };

  const handleSave = useCallback(async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    setSaving(true);
    try {
      const imagenUrl = await uploadCover();
      const { error } = await getSupabase()
        .from('relatos')
        .update({
          title: titulo.trim(),
          titulo: titulo.trim(),
          content: cuerpo,
          cuerpo,
          excerpt: extracto.trim(),
          resumen: extracto.trim(),
          extracto: extracto.trim(),
          tags,
          pais,
          categoria,
          cover_image_url: imagenUrl,
          portada_url: imagenUrl,
          imagen_url: imagenUrl,
          lectura_minutos: calcReadingTime(cuerpo),
          tiempo_lectura: calcReadingTime(cuerpo),
        })
        .eq('id', relato.id)
        .eq('autor_id', userId);
      if (error) { toast.error('Error al guardar: ' + error.message); return; }
      toast.success('Cambios guardados');
      router.push('/mis-relatos');
    } catch (e: any) {
      toast.error('Error inesperado: ' + e.message);
    } finally {
      setSaving(false);
    }
  }, [titulo, cuerpo, extracto, tags, pais, categoria, relato.id, userId]);

  const wordCount = cuerpo.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/mis-relatos" className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Editando relato</p>
          <h1 className="font-display text-xl font-bold text-foreground">{relato.titulo || 'Sin título'}</h1>
        </div>
      </div>

      <div className="space-y-8">
        {/* Título */}
        <section className="space-y-2">
          <label className="block text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Título <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Título del relato"
            className="input-field text-lg font-display"
          />
        </section>

        {/* Extracto */}
        <section className="space-y-2">
          <label className="block text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Extracto / Sinopsis
          </label>
          <textarea
            value={extracto}
            onChange={e => setExtracto(e.target.value)}
            placeholder="Breve descripción que aparece en la portada…"
            rows={3}
            className="input-field resize-none"
          />
        </section>

        {/* Tags */}
        <section className="space-y-2">
          <label className="block text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Etiquetas
          </label>
          <div className="relative">
            <div className="flex flex-wrap gap-2 p-3 border border-border rounded-xl bg-surface min-h-[48px]">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} className="ml-0.5 opacity-60 hover:opacity-100">×</button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={e => handleTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && tagInput.trim()) { e.preventDefault(); addTag(tagInput.trim()); } }}
                placeholder={tags.length === 0 ? 'Añadir etiqueta…' : ''}
                className="bg-transparent outline-none text-sm text-foreground placeholder-muted-foreground/40 flex-1 min-w-[120px]"
              />
            </div>
            {showTagDropdown && tagSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-xl z-20 overflow-hidden">
                {tagSuggestions.map(s => (
                  <button key={s} type="button" onClick={() => addTag(s)}
                    className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                    #{s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* País y Categoría */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <section className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground uppercase tracking-wider">País</label>
            <select value={pais} onChange={e => setPais(e.target.value)} className="input-field">
              <option value="">Seleccionar…</option>
              {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </section>
          <section className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground uppercase tracking-wider">Categoría</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)} className="input-field">
              <option value="">Seleccionar…</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </section>
        </div>

        {/* Portada */}
        <section className="space-y-2">
          <label className="block text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Imagen de portada
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative cursor-pointer rounded-xl border-2 border-dashed border-border hover:border-primary/60 transition-all overflow-hidden bg-surface h-48 flex items-center justify-center"
          >
            {coverPreview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverPreview} alt="portada" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm">Cambiar imagen</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Haz clic para subir portada</p>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
        </section>

        {/* Contenido */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Contenido <span className="text-primary">*</span>
            </label>
            <span className="text-xs text-muted-foreground">{wordCount} palabras · ~{calcReadingTime(cuerpo)} min</span>
          </div>
          <RichTextEditor
            value={cuerpo}
            onChange={setCuerpo}
            placeholder="El contenido del relato…"
          />
        </section>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border flex-wrap gap-3">
          <Link href="/mis-relatos" className="btn-ghost text-sm">
            Cancelar
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {saving
              ? <><Loader2 size={14} className="animate-spin" /> Guardando…</>
              : <><Save size={14} /> Guardar cambios</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
