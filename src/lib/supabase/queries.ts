import { createClient } from './server';
import type { Story, Author } from '@/lib/mockData';
import { mapRelatoToStory, mapProfileToAuthor } from './mappers';
import type { SupabaseRelato, SupabaseProfile } from './mappers';

export type { SupabaseRelato, SupabaseProfile };
export { mapRelatoToStory, mapProfileToAuthor };

// ─── Server-side queries (for async server components / page.tsx) ──────────────

export async function getPublishedStories(): Promise<Story[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('relatos')
      .select('*, autor:user_profiles(full_name, avatar_url, country, bio)')
      .in('estado', ['publicado', 'destacado'])
      .order('published_at', { ascending: false });
    if (error || !data) return [];
    return (data as SupabaseRelato[]).map(mapRelatoToStory);
  } catch {
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
    const withCounts = await Promise.all(
      profiles.map(async (p) => {
        const supabase2 = await createClient();
        const { count } = await supabase2
          .from('relatos')
          .select('id', { count: 'exact', head: true })
          .eq('autor_id', p.id)
          .in('estado', ['publicado', 'destacado']);
        return { ...p, story_count: count ?? 0 };
      })
    );
    return withCounts.map(mapProfileToAuthor);
  } catch {
    return [];
  }
}
