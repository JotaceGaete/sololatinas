import React from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import type { Author } from '@/lib/stories/types';
import { Users, ChevronRight } from 'lucide-react';

interface Props {
  authors: Author[];
}

export default function FeaturedAuthorsStrip({ authors }: Props) {
  const featured = authors.slice(0, 3);

  if (featured.length === 0) {
    return (
      <section className="py-16 bg-surface">
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Voces Destacadas
            </span>
          </div>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-6">
            Las autoras que{' '}
            <span className="text-gradient-gold italic">están marcando</span> el camino
          </h2>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Las primeras autoras de la comunidad aparecerán aquí.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-surface">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Voces Destacadas
              </span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground">
              Las autoras que{' '}
              <span className="text-gradient-gold italic">están marcando</span> el camino
            </h2>
          </div>
          <Link
            href="/authors-page"
            className="hidden md:flex items-center gap-1 text-sm text-primary hover:text-gold-light transition-colors font-medium"
          >
            Todos los autores <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featured.map((author) => (
            <Link key={`featured-author-${author.id}`} href="/authors-page" className="block">
              <div className="story-card p-6 group cursor-pointer hover:border-primary/30">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all">
                    <AppImage
                      src={author.avatar}
                      alt={`Foto de perfil de ${author.name}, autora de literatura romántica`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                      {author.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{author.country}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{author.storyCount} relatos</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {author.bio}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
