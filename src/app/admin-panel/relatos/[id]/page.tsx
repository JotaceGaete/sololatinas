

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, BookOpen, CalendarDays, UserRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { mapCapituloToModel, mapRelatoToStory } from '@/lib/supabase/mappers';
import type { SupabaseCapitulo, SupabaseProfile, SupabaseRelato } from '@/lib/supabase/mappers';
import { buildInitialStoryChapter, shiftStoredChaptersAfterInitial } from '@/lib/stories/chapters';
import { renderStoryHtml } from '@/lib/stories/render';

interface Props {
  params: Promise<{ id: string }>;
}

const statusLabels: Record<string, string> = {
  publicado: 'Publicado',
  destacado: 'Destacado',
  revision: 'En revision',
  borrador: 'Borrador',
  archivado: 'Archivado',
};

function formatDate(value: string | null | undefined) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function renderAdminStoryHtml(content: string) {
  return renderStoryHtml(content).replace(
    /<div([^>]*data-media-url="([^"]+)"[^>]*)>([\s\S]*?)<\/div>/gi,
    (_match, attrs: string, url: string, label: string) =>
      `<a${attrs} href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
  );
}

export default async function AdminRelatoDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) redirect('/sign-up-login-screen');

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('email')
    .eq('email', user.email)
    .maybeSingle();

  if (!adminUser) redirect('/admin-panel');

  const { data: relato } = await supabase.from('relatos').select('*').eq('id', id).maybeSingle();

  if (!relato) redirect('/admin-panel');

  const story = mapRelatoToStory(relato as SupabaseRelato);

  const [profileResult, chaptersResult] = await Promise.all([
    story.authorId
      ? supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url, country, bio, role, created_at')
          .eq('id', story.authorId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('historia_capitulos')
      .select('*, media_blocks:capitulo_media_blocks(*)')
      .eq('historia_id', story.id)
      .order('numero', { ascending: true }),
  ]);

  const profile = profileResult.data as SupabaseProfile | null;
  const storedChapters = ((chaptersResult.data ?? []) as SupabaseCapitulo[]).map(
    mapCapituloToModel
  );
  const initialChapter = buildInitialStoryChapter(story);
  const chapters = initialChapter
    ? [initialChapter, ...shiftStoredChaptersAfterInitial(storedChapters)]
    : storedChapters;
  const status = statusLabels[story.status] ?? story.status;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-5 py-8">
        <Link
          href="/admin-panel"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Volver al panel admin
        </Link>

        <section className="rounded-xl border border-border bg-surface p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
                Vista admin de relato
              </p>
              <h1 className="font-display text-3xl font-bold text-foreground">{story.title}</h1>
              {story.excerpt && (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {story.excerpt}
                </p>
              )}
            </div>
            <span className="w-fit rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {status}
            </span>
          </div>

          <div className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <UserRound size={16} className="mb-2 text-primary" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground/70">Autor/a</p>
              <p className="mt-1 font-medium text-foreground">
                {profile?.full_name ?? story.author}
              </p>
              {profile?.role && <p className="text-xs">{profile.role}</p>}
            </div>
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <CalendarDays size={16} className="mb-2 text-primary" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground/70">Fecha</p>
              <p className="mt-1 font-medium text-foreground">{formatDate(story.publishedAt)}</p>
            </div>
            <div className="rounded-lg border border-border bg-background/40 p-3">
              <BookOpen size={16} className="mb-2 text-primary" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground/70">Capitulos</p>
              <p className="mt-1 font-medium text-foreground">{chapters.length}</p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 font-display text-xl font-semibold text-foreground">
            Contenido completo
          </h2>
          {story.fullText ? (
            <div
              className="admin-story-content text-base leading-8 text-foreground"
              dangerouslySetInnerHTML={{ __html: renderAdminStoryHtml(story.fullText) }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Este relato no tiene contenido principal guardado.
            </p>
          )}
        </section>

        <section className="mt-6 rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 font-display text-xl font-semibold text-foreground">Capitulos</h2>
          {chapters.length === 0 ? (
            <p className="text-sm text-muted-foreground">Este relato no tiene capitulos.</p>
          ) : (
            <div className="space-y-5">
              {chapters.map((chapter) => (
                <article
                  key={chapter.id}
                  className="rounded-lg border border-border bg-background/40 p-5"
                >
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                        Capitulo {chapter.numero}
                      </p>
                      <h3 className="mt-1 font-display text-lg font-semibold text-foreground">
                        {chapter.titulo || `Capitulo ${chapter.numero}`}
                      </h3>
                    </div>
                    <span className="w-fit rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                      {chapter.publishedAt ? 'Publicado' : 'No publicado'}
                    </span>
                  </div>
                  {chapter.cuerpo ? (
                    <div
                      className="admin-story-content text-base leading-8 text-foreground"
                      dangerouslySetInnerHTML={{ __html: renderAdminStoryHtml(chapter.cuerpo) }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">Capitulo sin contenido.</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <style>{`
        .admin-story-content p { margin: 0 0 1rem; }
        .admin-story-content h1,
        .admin-story-content h2,
        .admin-story-content h3 { color: #C9A96E; font-weight: 700; margin: 1.25rem 0 0.75rem; }
        .admin-story-content blockquote { border-left: 3px solid #C9A96E; margin: 1rem 0; padding-left: 1rem; color: #A89080; font-style: italic; }
        .admin-story-content img { max-width: 100%; border-radius: 0.75rem; margin: 1rem 0; }
        .admin-story-content ul,
        .admin-story-content ol { margin: 0.75rem 0 1rem; padding-left: 1.5rem; }
        .admin-story-content ul { list-style: disc; }
        .admin-story-content ol { list-style: decimal; }
        .admin-story-content .ch-reveal-block,
        .admin-story-content .ch-media-block {
          display: block;
          width: fit-content;
          margin: 1.25rem auto;
          padding: 0.5rem 1.5rem;
          border: 1px solid rgba(201, 169, 110, 0.35);
          border-radius: 999px;
          color: #C9A96E;
          font-size: 0.8rem;
          letter-spacing: 0.08em;
          text-decoration: none;
        }
      `}</style>
    </main>
  );
}
