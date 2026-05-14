import { createClient } from './server';
import type { Author, Story } from '@/lib/stories/types';
import { isPublishedRelato, mapRelatoToStory, mapProfileToAuthor } from './mappers';
import type { SupabaseRelato, SupabaseProfile } from './mappers';

export type { SupabaseRelato, SupabaseProfile };
export { mapRelatoToStory, mapProfileToAuthor };

// ─── Server-side queries (for async server components / page.tsx) ──────────────

export async function getPublishedStories(): Promise<Story[]> {
  // ── DIAGNOSTIC: raw probe (bypass JS filter) ─────────────────────────────
  try {
    const supabaseProbe = await createClient();
    const probe = await supabaseProbe
      .from('relatos')
      .select('id, titulo, estado, status, published, created_at, autor_id')
      .limit(5);
    console.log('[DIAG getPublishedStories] raw probe:', {
      error: probe.error ?? null,
      count: probe.data?.length ?? 0,
      rows: probe.data?.map((r: any) => ({
        id: r.id,
        titulo: r.titulo,
        estado: r.estado,
        status: r.status,
        published: r.published,
        autor_id: r.autor_id,
      })) ?? [],
    });
  } catch (probeErr) {
    console.error('[DIAG getPublishedStories] probe threw:', probeErr);
  }
  // ── END DIAGNOSTIC ───────────────────────────────────────────────────────

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('relatos')
      .select('*, autor:user_profiles(full_name, avatar_url, country, bio)')
      .order('created_at', { ascending: false });

    console.log('[DIAG getPublishedStories] main query:', {
      error: error ?? null,
      total: data?.length ?? 0,
      first3: (data ?? []).slice(0, 3).map((r: any) => ({
        id: r.id,
        titulo: r.titulo,
        estado: r.estado,
        status: r.status,
        published: r.published,
      })),
    });

    if (error) {
      console.error('[DIAG getPublishedStories] Supabase error:', error.message, error.details, error.hint);
      return [];
    }
    if (!data) {
      console.error('[DIAG getPublishedStories] data is null/undefined');
      return [];
    }

    const filtered = (data as SupabaseRelato[]).filter(isPublishedRelato);
    console.log('[DIAG getPublishedStories] after isPublishedRelato filter:', filtered.length, '/', data.length);

    return filtered.map(mapRelatoToStory);
  } catch (err) {
    console.error('[DIAG getPublishedStories] caught exception:', err);
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
