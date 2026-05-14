'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import StoryCard from '@/components/ui/StoryCard';
import { createClient } from '@/lib/supabase/client';
import type { Author, Story } from '@/lib/stories/types';
import type { SupabaseRelato, SupabaseProfile } from '@/lib/supabase/mappers';
import { isPublishedRelato, mapRelatoToStory, mapProfileToAuthor } from '@/lib/supabase/mappers';
import { Users, MapPin, BookOpen, Heart, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { toast } from 'sonner';

const countryFilters = ['Todos', 'Colombia', 'México', 'Argentina', 'España', 'Venezuela', 'Chile'];
const countryFlags: Record<string, string> = {
  Colombia: '🇨🇴', México: '🇲🇽', Argentina: '🇦🇷',
  España: '🇪🇸', Venezuela: '🇻🇪', Chile: '🇨🇱',
};

function AuthorCard({ author, allStories }: { author: Author; allStories: Story[] }) {
  const [expanded, setExpanded] = useState(false);
  const [following, setFollowing] = useState(false);
  const authorStories = allStories.filter((s) => s.authorId === author.id).slice(0, 3);

  const handleFollow = () => {
    setFollowing((v) => !v);
    toast.success(following ? `Dejaste de seguir a ${author.name}` : `Ahora sigues a ${author.name} 💛`);
  };

  return (
    <div className="story-card overflow-visible group">
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all">
              <AppImage
                src={author.avatar}
                alt={`Foto de perfil de ${author.name}, autora de literatura romántica de ${author.country}`}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            </div>
            {author.featured && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <Star size={10} className="fill-primary-foreground text-primary-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                  {author.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-sm">{countryFlags[author.country] || '🌎'}</span>
                  <span className="text-xs text-muted-foreground">{author.country}</span>
                </div>
              </div>
              <button
                onClick={handleFollow}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  following
                    ? 'bg-primary/15 text-primary border-primary/30' :'border-border text-muted-foreground hover:border-primary/40 hover:text-primary'
                }`}
              >
                {following ? '✓ Siguiendo' : 'Seguir'}
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen size={11} /> {author.storyCount} relatos
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="text-sm text-muted-foreground leading-relaxed mt-4 line-clamp-3">
          {author.bio}
        </p>

        {/* Tags */}
        {author.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {author.tags.map((tag) => (
              <span key={`author-card-tag-${author.id}-${tag}`} className="tag-pill tag-pill-rose text-[10px]">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Expand Button */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-center gap-2 py-3 border-t border-border text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
      >
        {expanded ? (
          <><ChevronUp size={14} /> Ocultar relatos</>
        ) : (
          <><ChevronDown size={14} /> Ver relatos ({authorStories.length})</>
        )}
      </button>

      {/* Expanded Stories */}
      {expanded && (
        <div className="border-t border-border bg-surface-elevated p-4 space-y-2 animate-fade-in">
          {authorStories.length > 0 ? (
            authorStories.map((story) => (
              <StoryCard key={`author-story-${story.id}`} story={story} variant="compact" />
            ))
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              Esta autora aún no tiene relatos publicados
            </p>
          )}
          <Link
            href="/stories-library"
            className="block text-center text-xs text-primary hover:text-gold-light transition-colors mt-2 pt-2 border-t border-border"
          >
            Ver todos los relatos →
          </Link>
        </div>
      )}
    </div>
  );
}

export default function AuthorsPageClient() {
  const [activeCountry, setActiveCountry] = useState('Todos');
  const [authors, setAuthors] = useState<Author[]>([]);
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function fetchData() {
      try {
        const [profilesResult, storiesResult] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('id, full_name, avatar_url, country, bio, role, created_at')
            .eq('role', 'author')
            .eq('is_active', true)
            .order('created_at', { ascending: true })
            .limit(20),
          supabase
            .from('relatos')
            .select('*, autor:user_profiles(full_name, avatar_url, country, bio)')
            .order('created_at', { ascending: false }),
        ]);

        const profiles = (profilesResult.data ?? []) as SupabaseProfile[];
        const relatos = (storiesResult.data ?? []) as SupabaseRelato[];
        const stories = relatos.filter(isPublishedRelato).map(mapRelatoToStory);

        const withCounts = profiles.map((p) => ({
          ...p,
          story_count: stories.filter((s) => s.authorId === p.id).length,
        }));

        setAuthors(withCounts.map(mapProfileToAuthor));
        setAllStories(stories);
      } catch {
        // no-op: show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const featuredAuthor = authors.length > 0
    ? authors.reduce((max, a) => a.storyCount > max.storyCount ? a : max)
    : null;

  const filtered = activeCountry === 'Todos'
    ? authors
    : authors.filter((a) => a.country === activeCountry);

  if (loading) {
    return (
      <div className="pt-20 min-h-screen">
        <div className="bg-surface border-b border-border px-6 lg:px-10 py-10 max-w-screen-2xl mx-auto">
          <div className="h-8 bg-muted/30 rounded w-64 animate-pulse mb-3" />
          <div className="h-12 bg-muted/30 rounded w-96 animate-pulse" />
        </div>
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 rounded-xl bg-surface border border-border animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen">
      {/* Page Header */}
      <div className="bg-surface border-b border-border px-6 lg:px-10 py-10 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <Users size={16} className="text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Comunidad de Autoras</span>
        </div>
        <h1 className="font-display text-4xl font-bold text-foreground mb-2">
          Las <span className="text-gradient-gold italic">voces</span> detrás de los relatos
        </h1>
        <p className="text-muted-foreground text-sm">
          {authors.length > 0
            ? `${authors.length} autora${authors.length !== 1 ? 's' : ''} de ${[...new Set(authors.map((a) => a.country))].filter(Boolean).length} países escriben para ti`
            : 'La comunidad de autoras está creciendo'}
        </p>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 py-10">
        {/* Featured Author Spotlight */}
        {featuredAuthor && featuredAuthor.storyCount > 0 && (
          <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-surface mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="relative z-10 p-6 lg:p-8 flex flex-col lg:flex-row items-start lg:items-center gap-6">
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-primary/30">
                  <AppImage
                    src={featuredAuthor.avatar}
                    alt={`Foto destacada de ${featuredAuthor.name}, autora de literatura romántica de ${featuredAuthor.country}`}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full uppercase tracking-wide">
                  Destacada
                </div>
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="font-display text-2xl font-bold text-foreground">{featuredAuthor.name}</h2>
                  <span className="text-sm">{countryFlags[featuredAuthor.country] || '🌎'}</span>
                  <span className="text-sm text-muted-foreground">{featuredAuthor.country}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-xl">
                  {featuredAuthor.bio}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <BookOpen size={14} className="text-primary" />
                    <strong className="text-foreground">{featuredAuthor.storyCount}</strong> relatos publicados
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  className="btn-primary text-sm"
                  onClick={() => toast.success(`Ahora sigues a ${featuredAuthor.name} 💛`)}
                >
                  Seguir autora
                </button>
                <Link href="/stories-library" className="btn-outline text-sm text-center">
                  Ver sus relatos
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Country Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {countryFilters.map((country) => (
            <button
              key={`author-filter-${country}`}
              onClick={() => setActiveCountry(country)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                activeCountry === country
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {country !== 'Todos' && countryFlags[country]} {country}
            </button>
          ))}
        </div>

        {/* Results label */}
        <p className="text-xs text-muted-foreground mb-5">
          {filtered.length} autora{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
          {activeCountry !== 'Todos' ? ` de ${activeCountry}` : ''}
        </p>

        {/* Authors Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-5">
            {filtered.map((author) => (
              <AuthorCard key={`author-card-${author.id}`} author={author} allStories={allStories} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-surface border border-border rounded-xl">
            <MapPin size={40} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-xl text-foreground mb-2">
              {authors.length === 0 ? 'La comunidad está creciendo' : `Próximamente autoras de ${activeCountry}`}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {authors.length === 0
                ? '¡Sé parte de las primeras voces de SoloLatinas!'
                : 'Estamos invitando escritoras de esta región. ¿Eres autora?'}
            </p>
            <Link href="/sign-up-login-screen" className="btn-primary inline-flex">
              Registrarme como autora
            </Link>
          </div>
        )}

        {/* Become an Author CTA */}
        <div className="mt-16 text-center">
          <div className="gold-divider mb-10 max-w-xs mx-auto" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">
            ¿Tienes historias que contar?
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Únete a nuestra comunidad de autoras y comparte tu voz con miles de lectoras latinas que están esperando tu historia.
          </p>
          <Link href="/sign-up-login-screen" className="btn-primary px-8 py-3 inline-flex">
            Publicar mi primer relato
          </Link>
        </div>
      </div>
    </div>
  );
}
