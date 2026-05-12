import React from 'react';
import Link from 'next/link';
import StoryCard from '@/components/ui/StoryCard';
import type { Story } from '@/lib/mockData';
import { TrendingUp, ChevronRight, BookOpen } from 'lucide-react';

interface Props {
  stories: Story[];
}

export default function AcclaimedStories({ stories }: Props) {
  const acclaimed = stories
    .filter((s) => s.status === 'destacado' || s.views > 10000)
    .slice(0, 6);

  if (acclaimed.length === 0) {
    return (
      <section className="py-20 max-w-screen-2xl mx-auto px-6 lg:px-10">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={16} className="text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Más Aclamados</span>
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-8">
          Relatos que no puedes{' '}
          <span className="text-gradient-gold italic">dejar de leer</span>
        </h2>
        <div className="text-center py-16 bg-surface border border-border rounded-xl">
          <BookOpen size={40} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Los primeros relatos destacados aparecerán aquí.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 max-w-screen-2xl mx-auto px-6 lg:px-10">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Más Aclamados
            </span>
          </div>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground">
            Relatos que no puedes{' '}
            <span className="text-gradient-gold italic">dejar de leer</span>
          </h2>
        </div>
        <Link
          href="/stories-library"
          className="hidden md:flex items-center gap-1 text-sm text-primary hover:text-gold-light transition-colors font-medium"
        >
          Ver todos <ChevronRight size={16} />
        </Link>
      </div>
      {/* Grid: 1 featured + 5 default */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-5">
        {acclaimed[0] && (
          <div className="md:col-span-2 lg:col-span-1">
            <StoryCard story={acclaimed[0]} variant="featured" />
          </div>
        )}
        {acclaimed.slice(1, 6).map((story) => (
          <div key={`acclaimed-${story.id}`}>
            <StoryCard story={story} />
          </div>
        ))}
      </div>
      <div className="mt-8 flex md:hidden justify-center">
        <Link href="/stories-library" className="btn-outline">
          Ver todos los relatos <ChevronRight size={16} />
        </Link>
      </div>
    </section>
  );
}
