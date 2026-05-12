import type { Author, Story, StoryStatus } from '@/lib/stories/types';
import { PUBLIC_STORY_STATUSES, STORY_STATUS } from '@/lib/stories/types';

export interface SupabaseRelato {
  id: string;
  title?: string | null;
  titulo?: string | null;
  slug?: string | null;
  excerpt?: string | null;
  resumen?: string | null;
  extracto?: string | null;
  content?: string | null;
  cuerpo?: string | null;
  tags?: string[] | string | null;
  cover_image_url?: string | null;
  portada_url?: string | null;
  imagen_url?: string | null;
  pais?: string | null;
  categoria?: string | null;
  author_id?: string | null;
  autor_id?: string | null;
  status?: string | null;
  estado?: string | null;
  published?: boolean | null;
  destacado?: boolean | null;
  vistas?: number | null;
  likes?: number | null;
  lectura_minutos?: number | null;
  tiempo_lectura?: number | null;
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

function firstText(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() ?? '';
}

function firstNumber(...values: Array<number | null | undefined>) {
  return values.find((value) => typeof value === 'number' && Number.isFinite(value)) ?? 0;
}

function normalizeTags(tags: SupabaseRelato['tags']) {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeStatusValue(value: string | null | undefined, featured?: boolean | null): StoryStatus {
  const raw = (value ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');

  if (featured || raw === 'destacado' || raw === 'featured') return STORY_STATUS.featured;
  if (raw === 'published' || raw === 'publicado') return STORY_STATUS.published;
  if (raw === 'revision' || raw === 'en_revision' || raw === 'review' || raw === 'pending') {
    return STORY_STATUS.revision;
  }
  if (raw === 'archivado' || raw === 'archived') return STORY_STATUS.archived;
  return STORY_STATUS.draft;
}

export function normalizeRelatoStatus(r: Pick<SupabaseRelato, 'estado' | 'status' | 'published' | 'destacado'>): StoryStatus {
  const estadoStatus = normalizeStatusValue(r.estado, r.destacado);
  if (estadoStatus !== STORY_STATUS.draft) return estadoStatus;

  const statusStatus = normalizeStatusValue(r.status, r.destacado);
  if (statusStatus !== STORY_STATUS.draft) return statusStatus;

  if (r.published) return STORY_STATUS.published;
  return STORY_STATUS.draft;
}

export function mapRelatoToStory(r: SupabaseRelato): Story {
  const status = normalizeRelatoStatus(r);
  const title = firstText(r.title, r.titulo, r.slug, 'Relato sin titulo');
  const excerpt = firstText(r.excerpt, r.resumen, r.extracto, r.content, r.cuerpo);
  const content = firstText(r.content, r.cuerpo, excerpt);

  return {
    id: r.id,
    title,
    author: r.autor?.full_name ?? 'Autora',
    authorId: firstText(r.autor_id, r.author_id),
    country: firstText(r.pais),
    excerpt,
    fullText: content,
    coverImage: firstText(r.cover_image_url, r.portada_url, r.imagen_url),
    tags: normalizeTags(r.tags),
    readingTime: firstNumber(r.lectura_minutos, r.tiempo_lectura) || 10,
    views: firstNumber(r.vistas),
    likes: firstNumber(r.likes),
    isPremium: false,
    status,
    publishedAt: r.published_at ?? r.created_at,
    genre: firstText(r.categoria, 'Romance'),
  };
}

export function isPublishedRelato(r: SupabaseRelato) {
  return Boolean(r.published) || PUBLIC_STORY_STATUSES.includes(normalizeRelatoStatus(r));
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
