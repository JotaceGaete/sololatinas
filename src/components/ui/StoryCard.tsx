import React from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import { Clock, Heart, Eye } from 'lucide-react';
import type { Story } from '@/lib/stories/types';

interface StoryCardProps {
  story: Story;
  variant?: 'default' | 'featured' | 'compact';
}

const countryFlags: Record<string, string> = {
  Colombia: '🇨🇴',
  México: '🇲🇽',
  Argentina: '🇦🇷',
  España: '🇪🇸',
  Venezuela: '🇻🇪',
  Chile: '🇨🇱',
  Perú: '🇵🇪',
  Uruguay: '🇺🇾',
};

export default function StoryCard({ story, variant = 'default' }: StoryCardProps) {
  const storyHref = `/immersive-reading-mode?id=${story.id}`;

  if (variant === 'compact') {
    return (
      <Link href={storyHref} className="block">
        <div className="story-card flex gap-3 p-3 group cursor-pointer">
          <div className="relative w-16 h-20 flex-shrink-0 overflow-hidden rounded-md">
            <AppImage
              src={story.coverImage}
              alt={`Portada del relato ${story.title} por ${story.author}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-display text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {story.title}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">{story.author}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock size={10} /> {story.readingTime} min
              </span>
              <span className="text-xs">{countryFlags[story.country] || '🌎'}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link href={storyHref} className="block">
        <div className="story-card group cursor-pointer relative overflow-hidden h-96">
          <AppImage
            src={story.coverImage}
            alt={`Imagen artística del relato ${story.title} - ${story.excerpt.slice(0, 60)}`}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 overlay-dark-full" />
          <div className="absolute inset-0 p-6 flex flex-col justify-end">
            <div className="flex flex-wrap gap-1 mb-3">
              {story.tags.slice(0, 3).map((tag) => (
                <span key={`featured-tag-${story.id}-${tag}`} className="tag-pill text-[10px]">
                  #{tag}
                </span>
              ))}
            </div>
            <h3 className="font-display text-2xl font-bold text-cream leading-tight mb-2 group-hover:text-primary transition-colors">
              {story.title}
            </h3>
            <p className="text-sm text-cream/70 line-clamp-2 mb-3 leading-relaxed">
              {story.excerpt}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">
                    {story.author.charAt(0)}
                  </span>
                </div>
                <span className="text-xs text-cream/80 font-medium">{story.author}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-cream/60">
                <span className="flex items-center gap-1">
                  <Eye size={11} /> {story.views.toLocaleString('es')}
                </span>
                <span className="flex items-center gap-1">
                  <Heart size={11} /> {story.likes.toLocaleString('es')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={storyHref} className="block">
      <div className="story-card group cursor-pointer">
        <div className="relative h-52 overflow-hidden">
          <AppImage
            src={story.coverImage}
            alt={`Portada artística: ${story.title} por ${story.author}, historia romántica ${story.country}`}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 overlay-dark" />
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="text-base">{countryFlags[story.country] || '🌎'}</span>
            {story.isPremium && (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-primary/90 text-primary-foreground rounded-full uppercase tracking-wide">
                Premium
              </span>
            )}
          </div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1 text-cream/70 text-xs">
            <Clock size={11} /> {story.readingTime} min
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-display text-base font-semibold text-foreground leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">
            {story.title}
          </h3>
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
            {story.excerpt}
          </p>
          <div className="flex flex-wrap gap-1 mb-3">
            {story.tags.slice(0, 3).map((tag) => (
              <span key={`card-tag-${story.id}-${tag}`} className="tag-pill">
                #{tag}
              </span>
            ))}
          </div>
          <div className="gold-divider mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-[9px] font-bold text-primary">{story.author.charAt(0)}</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">{story.author}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <Eye size={11} /> {story.views >= 1000 ? `${(story.views / 1000).toFixed(1)}k` : story.views}
              </span>
              <span className="flex items-center gap-0.5">
                <Heart size={11} /> {story.likes >= 1000 ? `${(story.likes / 1000).toFixed(1)}k` : story.likes}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
