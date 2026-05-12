import React from 'react';
import Link from 'next/link';
import StoryCard from '@/components/ui/StoryCard';
import type { Story } from '@/lib/stories/types';
import { Sparkles, ChevronRight } from 'lucide-react';

interface Props {
  stories: Story[];
}

export default function NewStoriesSection({ stories }: Props) {
  const newStories = [...stories]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 4);

  return (
    <section className="py-16 bg-surface">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-accent" />
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                Recién Llegados
              </span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground">
              Nuevos <span className="italic text-gradient-rose">esta semana</span>
            </h2>
          </div>
          <Link
            href="/stories-library"
            className="hidden md:flex items-center gap-1 text-sm text-accent hover:text-rose-soft transition-colors font-medium"
          >
            Ver todos <ChevronRight size={16} />
          </Link>
        </div>

        {newStories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-5">
            {newStories.map((story) => (
              <StoryCard key={`new-${story.id}`} story={story} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Los relatos más recientes aparecerán aquí.</p>
          </div>
        )}
      </div>
    </section>
  );
}
