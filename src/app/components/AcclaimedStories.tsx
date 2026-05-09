'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import StoryCard from '@/components/ui/StoryCard';
import type { Story } from '@/lib/mockData';
import { createClient } from '@/lib/supabase/client';
import { getRelatoImageUrl } from '@/lib/relato-display';
import { TrendingUp, ChevronRight } from 'lucide-react';

interface RelatoRow {
  id: string;
  titulo: string;
  cuerpo: string | null;
  extracto: string | null;
  tags: string[] | null;
  pais: string | null;
  categoria: string | null;
  imagen_url: string | null;
  portada_url?: string | null;
  cover_image_url?: string | null;
  vistas: number | null;
  likes: number | null;
  estado: string;
  tiempo_lectura: number | null;
  created_at: string;
  autor_id: string | null;
}

function mapToStory(r: RelatoRow): Story {
  const imageUrl = getRelatoImageUrl(r);
  return {
    id: r.id,
    title: r.titulo ?? '',
    author: 'Autora',
    authorId: r.autor_id ?? '',
    country: r.pais ?? '',
    excerpt: r.extracto ?? '',
    fullText: r.cuerpo ?? r.extracto ?? '',
    coverImage: imageUrl,
    tags: r.tags ?? [],
    readingTime: r.tiempo_lectura ?? 5,
    views: r.vistas ?? 0,
    likes: r.likes ?? 0,
    isPremium: false,
    status: (r.estado as Story['status']) ?? 'publicado',
    publishedAt: r.created_at,
    genre: r.categoria ?? 'Romance',
  };
}

export default function AcclaimedStories() {
  const [acclaimed, setAcclaimed] = useState<Story[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('relatos')
      .select('*')
      .in('estado', ['publicado', 'published'])
      .order('vistas', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setAcclaimed((data as RelatoRow[]).map(mapToStory));
      });
  }, []);

  if (acclaimed.length === 0) return null;

  return (
    <section className="py-20 max-w-screen-2xl mx-auto px-6 lg:px-10">
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
