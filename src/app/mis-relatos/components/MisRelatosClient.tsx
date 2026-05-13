'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PenLine, BookOpen, Eye, Heart, Clock, Globe, Archive, MoreVertical, Edit3, Trash2, Send, FileText, Plus, ChevronDown, Search, MessageCircle, Layers } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


// ─── Types ────────────────────────────────────────────────────────────────────

interface Relato {
  id: string;
  slug?: string | null;
  titulo: string;
  extracto: string;
  tags: string[];
  pais: string;
  categoria: string;
  imagen_url: string | null;
  vistas: number;
  likes: number;
  estado: 'borrador' | 'revision' | 'publicado' | 'archivado';
  created_at: string;
  updated_at: string;
  comment_count?: number;
  reaction_count?: number;
  chapter_total?: number;
  chapter_published?: number;
  chapter_draft?: number;
}



// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  publicado: {
    label: 'Publicado',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10 border-emerald-400/30',
    dot: 'bg-emerald-400',
    icon: Globe
  },
  revision: {
    label: 'En revisión',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10 border-amber-400/30',
    dot: 'bg-amber-400',
    icon: Clock
  },
  borrador: {
    label: 'Borrador',
    color: 'text-zinc-400',
    bg: 'bg-zinc-400/10 border-zinc-400/30',
    dot: 'bg-zinc-400',
    icon: FileText
  },
  archivado: {
    label: 'Archivado',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10 border-rose-400/30',
    dot: 'bg-rose-400',
    icon: Archive
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatNumber(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ─── Story Row / Card ─────────────────────────────────────────────────────────

function StoryRow({
  relato,
  onDelete,
  onPublish,
}: {relato: Relato;onDelete: (id: string) => void;onPublish: (id: string) => void;}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cfg = STATUS_CONFIG[relato.estado];
  const StatusIcon = cfg.icon;

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-surface hover:border-primary/30 hover:bg-surface/80 transition-all duration-200">
    <div className="flex flex-col sm:flex-row gap-4 p-5">
      {/* Cover */}
      <div className="flex-shrink-0 w-full sm:w-20 h-28 sm:h-20 rounded-lg overflow-hidden bg-noir border border-border">
        {relato.imagen_url ?
        <img
          src={relato.imagen_url}
          alt={`Portada de ${relato.titulo}`}
          className="w-full h-full object-cover" /> :


        <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={24} className="text-muted-foreground/40" />
          </div>
        }
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold text-foreground truncate leading-snug">
              {relato.titulo}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
              {relato.extracto}
            </p>
          </div>

          {/* Status badge */}
          <div className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${cfg.bg} ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye size={12} />
            {formatNumber(relato.vistas)}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Heart size={12} />
            {formatNumber(relato.likes)}
          </span>
          {relato.comment_count !== undefined && relato.comment_count > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageCircle size={12} />
              {formatNumber(relato.comment_count)}
            </span>
          )}
          {relato.reaction_count !== undefined && relato.reaction_count > 0 && (
            <span className="flex items-center gap-1 text-xs text-[#C9A96E]/80">
              ✨ {formatNumber(relato.reaction_count)}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Globe size={12} />
            {relato.pais}
          </span>
          <span className="text-xs text-muted-foreground/60">
            Editado {formatDate(relato.updated_at)}
          </span>
        </div>

        {/* Tags */}
        {relato.tags?.length > 0 &&
        <div className="flex flex-wrap gap-1 mt-2">
            {relato.tags.slice(0, 4).map((tag) =>
          <span
            key={tag}
            className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary/80 border border-primary/20">
            
                #{tag}
              </span>
          )}
          </div>
        }
      </div>

      {/* Actions */}
      <div className="flex sm:flex-col items-center gap-2 sm:justify-start">
        <Link
          href={`/escribir-relato?edit=${relato.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all">
          
          <Edit3 size={12} />
          Editar
        </Link>

        {relato.estado === 'borrador' &&
        <button
          onClick={() => onPublish(relato.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-primary/40 text-primary hover:bg-primary/10 transition-all">
          
            <Send size={12} />
            Publicar
          </button>
        }

        {/* More menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            aria-label="Más opciones">
            
            <MoreVertical size={14} />
          </button>
          {menuOpen &&
          <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-40 bg-surface border border-border rounded-lg shadow-xl py-1 animate-fade-up">
                <Link
                href={`/immersive-reading-mode?id=${relato.id}`}
                className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                onClick={() => setMenuOpen(false)}>
                
                  <Eye size={12} />
                  Vista previa
                </Link>
                <button
                onClick={() => {onDelete(relato.id);setMenuOpen(false);}}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-400/10 transition-all">
                
                  <Trash2 size={12} />
                  Eliminar
                </button>
              </div>
            </>
          }
        </div>
      </div>
    </div>

      {/* Chapters footer */}
      <div className="border-t border-border px-5 py-2.5 flex items-center justify-between gap-3">
        {relato.chapter_total !== undefined && relato.chapter_total > 0 ? (
          <span className="text-xs text-muted-foreground">
            <Layers size={11} className="inline mr-1 opacity-60" />
            {relato.chapter_total} {relato.chapter_total === 1 ? 'capítulo' : 'capítulos'}
            {' · '}
            <span className="text-emerald-400">{relato.chapter_published} publicados</span>
            {relato.chapter_draft! > 0 && (
              <span className="text-amber-400/70"> · {relato.chapter_draft} borradores</span>
            )}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50">Sin capítulos</span>
        )}
        <Link
          href={`/mis-relatos/${relato.id}/capitulos`}
          className="flex items-center gap-1 text-xs text-primary/80 hover:text-primary transition-colors font-medium"
        >
          <Layers size={11} /> Gestionar capítulos →
        </Link>
      </div>
    </div>);

}

// ─── Stats Card ───────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: {icon: any;label: string;value: string | number;color: string;}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={16} className="text-foreground" />
      </div>
      <div>
        <p className="text-lg font-display font-semibold text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>);

}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MisRelatosClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = () => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  };

  const [relatos, setRelatos] = useState<Relato[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'todos' | 'publicado' | 'borrador' | 'revision' | 'archivado'>('todos');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'reciente' | 'vistas' | 'likes'>('reciente');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── Fetch stories ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (authLoading) return;
    fetchRelatos();
  }, [user, authLoading]);

  async function fetchRelatos() {
    setLoading(true);
    try {
      if (user) {
        const { data, error } = await getSupabase()
          .from('relatos')
          .select('id, slug, titulo, extracto, tags, pais, categoria, imagen_url, vistas, likes, estado, created_at, updated_at')
          .eq('autor_id', user.id)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        const relatosData = (data as Relato[]) ?? [];

        const enriched = await Promise.all(
          relatosData.map(async (r) => {
            const [commentResult, reactionResult, chapterResult] = await Promise.all([
              getSupabase().from('story_comments').select('id', { count: 'exact', head: true }).eq('relato_id', r.id),
              getSupabase().from('story_reactions').select('id', { count: 'exact', head: true }).eq('relato_id', r.id),
              getSupabase().from('historia_capitulos').select('estado').eq('historia_id', r.id),
            ]);
            const caps = (chapterResult.data ?? []) as { estado: string }[];
            return {
              ...r,
              comment_count: commentResult.count ?? 0,
              reaction_count: reactionResult.count ?? 0,
              chapter_total: caps.length,
              chapter_published: caps.filter((c) => c.estado === 'publicado').length,
              chapter_draft: caps.filter((c) => c.estado !== 'publicado').length,
            };
          })
        );

        setRelatos(enriched);
      } else {
        setRelatos([]);
      }
    } catch {
      setRelatos([]);
    } finally {
      setLoading(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    try {
      if (user) {
        await getSupabase().from('relatos').delete().eq('id', id).eq('autor_id', user.id);
      }
      setRelatos((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // no-op
    }
    setDeleteConfirm(null);
  }

  // ── Publish ────────────────────────────────────────────────────────────────

  async function handlePublish(id: string) {
    try {
      if (user) {
        await getSupabase()
          .from('relatos')
          .update({ estado: 'revision' })
          .eq('id', id)
          .eq('autor_id', user.id);
      }
      setRelatos((prev) =>
        prev.map((r) => r.id === id ? { ...r, estado: 'revision' as const } : r)
      );
    } catch {
      // no-op
    }
  }

  // ── Derived data ───────────────────────────────────────────────────────────

  const filtered = relatos.
  filter((r) => {
    if (activeFilter !== 'todos' && r.estado !== activeFilter) return false;
    if (search && !r.titulo.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).
  sort((a, b) => {
    if (sortBy === 'vistas') return b.vistas - a.vistas;
    if (sortBy === 'likes') return b.likes - a.likes;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const counts = {
    todos: relatos.length,
    publicado: relatos.filter((r) => r.estado === 'publicado').length,
    borrador: relatos.filter((r) => r.estado === 'borrador').length,
    revision: relatos.filter((r) => r.estado === 'revision').length,
    archivado: relatos.filter((r) => r.estado === 'archivado').length
  };

  const totalVistas = relatos.reduce((s, r) => s + r.vistas, 0);
  const totalLikes = relatos.reduce((s, r) => s + r.likes, 0);

  const FILTERS: {key: typeof activeFilter;label: string;}[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'publicado', label: 'Publicados' },
  { key: 'borrador', label: 'Borradores' },
  { key: 'revision', label: 'En revisión' },
  { key: 'archivado', label: 'Archivados' }];


  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-noir pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pt-6">
          <div>
            <p className="text-xs font-medium text-primary/70 uppercase tracking-widest mb-1">Panel de escritora</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Mis Relatos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona, edita y publica tus historias
            </p>
          </div>
          <Link
            href="/escribir-relato"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-noir font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            
            <Plus size={16} />
            Nuevo relato
          </Link>
        </div>

        {/* Stats */}
        {!loading && relatos.length > 0 &&
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatCard icon={BookOpen} label="Total relatos" value={counts.todos} color="bg-primary/15" />
            <StatCard icon={Globe} label="Publicados" value={counts.publicado} color="bg-emerald-400/15" />
            <StatCard icon={Eye} label="Lecturas totales" value={formatNumber(totalVistas)} color="bg-sky-400/15" />
            <StatCard icon={Heart} label="Me encantó" value={formatNumber(totalLikes)} color="bg-rose-400/15" />
          </div>
        }

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Status tabs */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-surface border border-border overflow-x-auto flex-shrink-0">
            {FILTERS.map((f) =>
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
              activeFilter === f.key ?
              'bg-primary text-noir' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`
              }>
              
                {f.label}
                {counts[f.key] > 0 &&
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeFilter === f.key ? 'bg-noir/20 text-noir' : 'bg-white/10 text-muted-foreground'}`
              }>
                    {counts[f.key]}
                  </span>
              }
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por título..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-sm bg-surface border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors" />
            
          </div>

          {/* Sort */}
          <div className="relative flex-shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="appearance-none pl-3 pr-8 py-2 text-sm bg-surface border border-border rounded-lg text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors cursor-pointer">
              
              <option value="reciente">Más recientes</option>
              <option value="vistas">Más leídos</option>
              <option value="likes">Más amados</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Content */}
        {loading ?
        <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) =>
          <div key={i} className="h-28 rounded-xl bg-surface border border-border animate-pulse" />
          )}
          </div> :
        filtered.length === 0 ?
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-4">
              <PenLine size={24} className="text-muted-foreground/40" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              {search || activeFilter !== 'todos' ? 'Sin resultados' : 'Aún no has escrito ningún relato'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              {search || activeFilter !== 'todos' ?
            'Prueba con otros filtros o términos de búsqueda.' : 'Comparte tu primera historia con la comunidad de SoloLatinas.'}
            </p>
            {!search && activeFilter === 'todos' &&
          <Link
            href="/escribir-relato"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-noir font-semibold text-sm hover:bg-primary/90 transition-all">
            
                <Plus size={16} />
                Escribir mi primer relato
              </Link>
          }
          </div> :

        <div className="flex flex-col gap-3">
            {filtered.map((relato) =>
          <div key={relato.id} className="relative">
                {deleteConfirm === relato.id &&
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-noir/90 backdrop-blur-sm border border-rose-400/40">
                    <div className="text-center px-6">
                      <p className="text-sm font-medium text-foreground mb-3">¿Eliminar este relato?</p>
                      <div className="flex gap-2 justify-center">
                        <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-1.5 rounded-md text-xs border border-border text-muted-foreground hover:text-foreground transition-all">
                    
                          Cancelar
                        </button>
                        <button
                    onClick={() => handleDelete(relato.id)}
                    className="px-4 py-1.5 rounded-md text-xs bg-rose-500 text-white hover:bg-rose-600 transition-all">
                    
                          Sí, eliminar
                        </button>
                      </div>
                    </div>
                  </div>
            }
                <StoryRow
              relato={relato}
              onDelete={handleDelete}
              onPublish={handlePublish} />
            
              </div>
          )}
          </div>
        }

        {/* Footer note for guests */}
        {!user && !authLoading &&
        <div className="mt-8 p-4 rounded-xl border border-primary/20 bg-primary/5 text-center">
            <p className="text-sm text-muted-foreground">
              <Link href="/sign-up-login-screen" className="text-primary hover:underline font-medium">
                Inicia sesión
              </Link>{' '}
              para ver y gestionar tus propios relatos.
            </p>
          </div>
        }
      </div>
    </div>);

}