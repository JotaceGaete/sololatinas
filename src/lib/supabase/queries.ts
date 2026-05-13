import { createClient } from './server';
import type { Author, Story } from '@/lib/stories/types';
import { isPublishedRelato, mapRelatoToStory, mapProfileToAuthor } from './mappers';
import type { SupabaseRelato, SupabaseProfile } from './mappers';

export type { SupabaseRelato, SupabaseProfile };
export { mapRelatoToStory, mapProfileToAuthor };

// ─── Server-side queries (for async server components / page.tsx) ──────────────

export async function getPublishedStories(): Promise<Story[]> {
  try {
    const supabase = await createClient();
    let { data, error } = await supabase
      .from('relatos')
      .select('*')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('[getPublishedStories] published_at order failed, retrying with created_at:', error.message, error.details);
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
      console.log('[getPublishedStories] campos de estado (primeros 3):', data.slice(0, 3).map((r: Record<string, unknown>) => ({
        id: r['id'], status: r['status'], estado: r['estado'],
        published: r['published'], is_published: r['is_published'],
        destacado: r['destacado'], moderation_status: r['moderation_status'],
      })));
    }
    const published = (data as SupabaseRelato[]).filter(isPublishedRelato);
    console.log('[getPublishedStories] pasan isPublishedRelato:', published.length);
    return published.map(mapRelatoToStory);
  } catch (e) {
    console.error('[getPublishedStories] unexpected error:', e);
    return [];
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
    const { data: relatos } = await supabase2
      .from('relatos')
      .select('*');
    const publicStories = ((relatos ?? []) as SupabaseRelato[]).filter(isPublishedRelato);
    const withCounts = profiles.map((p) => ({
      ...p,
      story_count: publicStories.filter((story) => (story.autor_id ?? story.author_id) === p.id).length,
    }));
    return withCounts.map(mapProfileToAuthor);
  } catch {
    return [];
  }
}
