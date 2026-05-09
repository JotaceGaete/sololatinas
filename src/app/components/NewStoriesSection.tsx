'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import StoryCard from '@/components/ui/StoryCard';
import type { Story } from '@/lib/mockData';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, ChevronRight } from 'lucide-react';

interface RelatoRow {
  id: string;
  titulo: string;
  cuerpo: string | null;
  extracto: string | null;
  tags: string[] | null;
  pais: string | null;
  categoria: string | null;
  imagen_url: string | null;
  vistas: number | null;
  likes: number | null;
  estado: string;
  tiempo_lectura: number | null;
  created_at: string;
  autor_id: string | null;
}

function mapToStory(r: RelatoRow): Story {
  return {
    id: r.id,
    title: r.titulo ?? '',
    author: 'Autora',
    authorId: r.autor_id ?? '',
    country: r.pais ?? '',
    excerpt: r.extracto ?? '',
    fullText: r.cuerpo ?? r.extracto ?? '',
    coverImage: r.imagen_url ?? '',
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

export default function NewStoriesSection() {
  const [newStories, setNewStories] = useState<Story[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('relatos')
      .select('id, titulo, extracto, cuerpo, tags, pais, categoria, imagen_url, vistas, likes, estado, tiempo_lectura, created_at, autor_id')
      .in('estado', ['publicado', 'published'])
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => {
        if (data) setNewStories((data as RelatoRow[]).map(mapToStory));
      });
  }, []);

  if (newStories.length === 0) return null;

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-5">
          {newStories.map((story) => (
            <StoryCard key={`new-${story.id}`} story={story} />
          ))}
        </div>
      </div>
    </section>
  );
}
