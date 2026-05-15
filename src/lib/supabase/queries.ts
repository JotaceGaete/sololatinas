import { createClient } from './server';
import type { Author, Capitulo, Story } from '@/lib/stories/types';
import {
  isPublishedRelato,
  mapCapituloToModel,
  mapRelatoToStory,
  mapProfileToAuthor,
} from './mappers';
import type { SupabaseCapitulo, SupabaseRelato, SupabaseProfile } from './mappers';

export type { SupabaseCapitulo, SupabaseRelato, SupabaseProfile };
export { mapRelatoToStory, mapCapituloToModel, mapProfileToAuthor };

// ─── Server-side queries (for async server components / page.tsx) ──────────────

export async function getPublishedStories(): Promise<Story[]> {
  try {
    const supabase = await createClient();
    let { data, error } = await supabase
      .from('relatos')
      .select('*')
      .order('published_at', { ascending: false });

    if (error) {
      console.error(
        '[getPublishedStories] published_at order failed, retrying with created_at:',
        error.message,
        error.details
      );
      ({ data, error } = await supabase
        .from('relatos')
        .select('*')
        .order('created_at', { ascending: false }));
    }

    if (error || !data) {
      console.error('[getPublishedStories] query error:', error?.message, error?.details);
      return [];
    }
    console.log('[getPublishedStories] total recibidos:', data.length);
    if (data.length > 0) {
      console.log(
        '[getPublishedStories] campos de estado (primeros 3):',
        data.slice(0, 3).map((r: Record<string, unknown>) => ({
          id: r['id'],
          status: r['status'],
          estado: r['estado'],
          published: r['published'],
          is_published: r['is_published'],
          destacado: r['destacado'],
          moderation_status: r['moderation_status'],
        }))
      );
    }
    const published = (data as SupabaseRelato[]).filter(isPublishedRelato);
    console.log('[getPublishedStories] pasan isPublishedRelato:', published.length);
    return published.map(mapRelatoToStory);
  } catch (e) {
    console.error('[getPublishedStories] unexpected error:', e);
    return [];
  }
}

export async function getRelatoBySlug(slug: string): Promise<Story | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('relatos')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error || !data) return null;
    if (!isPublishedRelato(data as SupabaseRelato)) return null;
    return mapRelatoToStory(data as SupabaseRelato);
  } catch {
    return null;
  }
}

export async function getPublishedCapitulosByRelatoId(relatoId: string): Promise<Capitulo[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('historia_capitulos')
      .select('*, media_blocks:capitulo_media_blocks(*)')
      .eq('historia_id', relatoId)
      .eq('estado', 'publicado')
      .order('numero', { ascending: true });
    if (error) {
      console.error('[getPublishedCapitulosByRelatoId] error:', error.message);
      return [];
    }
    return ((data ?? []) as SupabaseCapitulo[]).map(mapCapituloToModel);
  } catch {
    return [];
  }
}

export async function getCapitulosByRelatoId(relatoId: string): Promise<Capitulo[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('historia_capitulos')
      .select('*, media_blocks:capitulo_media_blocks(*)')
      .eq('historia_id', relatoId)
      .order('numero', { ascending: true });
    if (error) {
      console.error('[getCapitulosByRelatoId] error:', error.message, error.details);
      return [];
    }
    return ((data ?? []) as SupabaseCapitulo[]).map(mapCapituloToModel);
  } catch {
    return [];
  }
}

export async function getCapituloByNumero(
  relatoId: string,
  numero: number
): Promise<Capitulo | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('historia_capitulos')
      .select('*, media_blocks:capitulo_media_blocks(*)')
      .eq('historia_id', relatoId)
      .eq('numero', numero)
      .maybeSingle();
    if (error || !data) return null;
    return mapCapituloToModel(data as SupabaseCapitulo);
  } catch {
    return null;
  }
}

export async function getAuthors(): Promise<Author[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, avatar_url, country, bio, role, created_at')
      .eq('role', 'author')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(20);
    if (error || !data) return [];

    const profiles = data as SupabaseProfile[];
    const supabase2 = await createClient();
    const { data: relatos } = await supabase2.from('relatos').select('*');
    const publicStories = ((relatos ?? []) as SupabaseRelato[]).filter(isPublishedRelato);
    const withCounts = profiles.map((p) => ({
      ...p,
      story_count: publicStories.filter((story) => (story.autor_id ?? story.author_id) === p.id)
        .length,
    }));
    return withCounts.map(mapProfileToAuthor);
  } catch {
    return [];
  }
}
