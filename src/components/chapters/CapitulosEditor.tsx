'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Capitulo } from '@/lib/stories/types';
import type { SupabaseCapitulo } from '@/lib/supabase/mappers';
import { mapCapituloToModel } from '@/lib/supabase/mappers';
import { BookOpen, Plus, Trash2, ChevronDown, ChevronUp, Save, ExternalLink } from 'lucide-react';

interface Props {
  relatoId: string;
  relatoSlug: string;
}

interface CapituloForm {
  titulo: string;
  cuerpo: string;
}

const EMPTY_FORM: CapituloForm = { titulo: '', cuerpo: '' };

export default function CapitulosEditor({ relatoId, relatoSlug }: Props) {
  const [capitulos, setCapitulos] = useState<Capitulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CapituloForm>(EMPTY_FORM);
  const [newForm, setNewForm] = useState<CapituloForm>(EMPTY_FORM);
  const [showNewForm, setShowNewForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  async function fetchCapitulos() {
    setLoading(true);
    const { data, error } = await supabase
      .from('historia_capitulos')
      .select('*')
      .eq('historia_id', relatoId)
      .order('numero', { ascending: true });
    if (error) {
      console.error('[CapitulosEditor] fetch error:', error.message);
    } else {
      setCapitulos(((data ?? []) as SupabaseCapitulo[]).map(mapCapituloToModel));
    }
    setLoading(false);
  }

  useEffect(() => { fetchCapitulos(); }, [relatoId]);

  async function handleCreate() {
    if (!newForm.titulo.trim() && !newForm.cuerpo.trim()) {
      toast.error('El capítulo necesita título o contenido');
      return;
    }
    setSaving(true);
    const nextNumero = capitulos.length > 0 ? Math.max(...capitulos.map((c) => c.numero)) + 1 : 1;
    const { error } = await supabase.from('historia_capitulos').insert({
      historia_id: relatoId,
      numero: nextNumero,
      titulo: newForm.titulo.trim(),
      cuerpo_html: newForm.cuerpo,
    });
    setSaving(false);
    if (error) {
      toast.error('Error al crear capítulo: ' + error.message);
    } else {
      toast.success(`Capítulo ${nextNumero} creado`);
      setNewForm(EMPTY_FORM);
      setShowNewForm(false);
      fetchCapitulos();
    }
  }

  async function handleSaveEdit(capitulo: Capitulo) {
    setSaving(true);
    const { error } = await supabase
      .from('historia_capitulos')
      .update({
        titulo: editForm.titulo.trim(),
        cuerpo_html: editForm.cuerpo,
      })
      .eq('id', capitulo.id);
    setSaving(false);
    if (error) {
      toast.error('Error al guardar: ' + error.message);
    } else {
      toast.success('Capítulo guardado');
      setEditingId(null);
      fetchCapitulos();
    }
  }

  async function handleDelete(capitulo: Capitulo) {
    if (!confirm(`¿Eliminar el capítulo ${capitulo.numero}? Esta acción es irreversible.`)) return;
    const { error } = await supabase.from('historia_capitulos').delete().eq('id', capitulo.id);
    if (error) {
      toast.error('Error al eliminar: ' + error.message);
    } else {
      toast.success(`Capítulo ${capitulo.numero} eliminado`);
      fetchCapitulos();
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-muted/20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BookOpen size={14} className="text-primary" />
          Capítulos ({capitulos.length})
        </h3>
        <div className="flex items-center gap-2">
          {relatoSlug && (
            <a
              href={`/historia/${relatoSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink size={12} /> Ver índice
            </a>
          )}
          <button
            onClick={() => setShowNewForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-all"
          >
            <Plus size={12} /> Nuevo capítulo
          </button>
        </div>
      </div>

      {/* New chapter form */}
      {showNewForm && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <p className="text-xs font-semibold text-primary">
            Capítulo {capitulos.length > 0 ? Math.max(...capitulos.map((c) => c.numero)) + 1 : 1}
          </p>
          <input
            type="text"
            placeholder="Título del capítulo"
            value={newForm.titulo}
            onChange={(e) => setNewForm((f) => ({ ...f, titulo: e.target.value }))}
            className="input-field text-sm"
          />
          <textarea
            placeholder="Contenido del capítulo (HTML o texto plano)..."
            value={newForm.cuerpo}
            onChange={(e) => setNewForm((f) => ({ ...f, cuerpo: e.target.value }))}
            rows={8}
            className="input-field text-sm resize-y"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setShowNewForm(false); setNewForm(EMPTY_FORM); }}
              className="btn-ghost text-xs"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Save size={12} /> {saving ? 'Guardando...' : 'Crear capítulo'}
            </button>
          </div>
        </div>
      )}

      {/* Chapter list */}
      {capitulos.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Este relato no tiene capítulos aún.{' '}
          <button
            onClick={() => setShowNewForm(true)}
            className="text-primary hover:underline"
          >
            Crear el primero
          </button>
        </p>
      ) : (
        <div className="space-y-2">
          {capitulos.map((cap) => {
            const isEditing = editingId === cap.id;
            const isExpanded = expandedId === cap.id;
            return (
              <div
                key={cap.id}
                className="rounded-xl border border-border bg-surface overflow-hidden"
              >
                {/* Row header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="w-6 text-xs font-bold text-primary text-center">
                    {cap.numero}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {cap.titulo || `Capítulo ${cap.numero}`}
                    </p>
                    {cap.extracto && (
                      <p className="text-xs text-muted-foreground truncate">{cap.extracto}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a
                      href={`/historia/${relatoSlug}/capitulo/${cap.numero}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                      title="Ver capítulo"
                    >
                      <ExternalLink size={13} />
                    </a>
                    <button
                      onClick={() => {
                        if (isEditing) {
                          setEditingId(null);
                        } else {
                          setEditingId(cap.id);
                          setExpandedId(cap.id);
                          setEditForm({ titulo: cap.titulo, cuerpo: cap.cuerpo });
                        }
                      }}
                      className="p-1.5 text-muted-foreground hover:text-primary transition-colors text-xs"
                      title={isEditing ? 'Cancelar edición' : 'Editar'}
                    >
                      {isEditing ? '✕' : '✎'}
                    </button>
                    <button
                      onClick={() => handleDelete(cap)}
                      className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded && !isEditing ? null : cap.id)}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded: edit form or preview */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Título del capítulo"
                          value={editForm.titulo}
                          onChange={(e) => setEditForm((f) => ({ ...f, titulo: e.target.value }))}
                          className="input-field text-sm"
                        />
                        <textarea
                          placeholder="Contenido del capítulo..."
                          value={editForm.cuerpo}
                          onChange={(e) => setEditForm((f) => ({ ...f, cuerpo: e.target.value }))}
                          rows={10}
                          className="input-field text-sm resize-y"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="btn-ghost text-xs">
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveEdit(cap)}
                            disabled={saving}
                            className="btn-primary text-xs flex items-center gap-1.5"
                          >
                            <Save size={12} /> {saving ? 'Guardando...' : 'Guardar cambios'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed whitespace-pre-wrap">
                        {cap.cuerpo.replace(/<[^>]*>/g, ' ').slice(0, 400)}
                        {cap.cuerpo.length > 400 && '…'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
