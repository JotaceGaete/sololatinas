import type { Story, Author } from '@/lib/mockData';

// ─── Raw Supabase row types (safe to import from client components) ────────────

export interface SupabaseRelato {
  id: string;
  titulo: string;
  extracto: string;
  cuerpo: string | null;
  tags: string[];
  imagen_url: string | null;
  pais: string;
  categoria: string;
  autor_id: string;
  estado: 'borrador' | 'revision' | 'publicado' | 'destacado' | 'archivado';
  vistas: number;
  likes: number;
  tiempo_lectura: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  autor?: {
    full_name: string | null;
    avatar_url: string | null;
    country: string | null;
    bio: string | null;
  } | null;
}

export interface SupabaseProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  country: string | null;
  bio: string | null;
  role: string;
  created_at: string;
  story_count?: number;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

export function mapRelatoToStory(r: SupabaseRelato): Story {
  return {
    id: r.id,
    title: r.titulo,
    author: r.autor?.full_name ?? 'Autora',
    authorId: r.autor_id,
    country: r.pais,
    excerpt: r.extracto,
    fullText: r.cuerpo ?? undefined,
    coverImage: r.imagen_url ?? '',
    tags: r.tags ?? [],
    readingTime: r.tiempo_lectura ?? 10,
    views: r.vistas ?? 0,
    likes: r.likes ?? 0,
    isPremium: false,
    status: r.estado,
    publishedAt: r.published_at ?? r.created_at,
    genre: r.categoria ?? 'Romance',
  };
}

export function mapProfileToAuthor(p: SupabaseProfile): Author {
  return {
    id: p.id,
    name: p.full_name ?? 'Autora',
    country: p.country ?? '',
    bio: p.bio ?? '',
    avatar: p.avatar_url ?? '',
    storyCount: p.story_count ?? 0,
    followers: 0,
    tags: [],
    joinedAt: p.created_at,
    featured: (p.story_count ?? 0) > 0,
  };
}
