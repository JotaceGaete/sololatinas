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
    const { data, error } = await supabase
      .from('relatos')
      .select('*, autor:user_profiles(full_name, avatar_url, country, bio)')
      .order('published_at', { ascending: false });
    if (error || !data) return [];
    return (data as SupabaseRelato[]).filter(isPublishedRelato).map(mapRelatoToStory);
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
