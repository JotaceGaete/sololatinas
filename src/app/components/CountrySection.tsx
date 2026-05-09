'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import StoryCard from '@/components/ui/StoryCard';
import type { Story } from '@/lib/mockData';
import { createClient } from '@/lib/supabase/client';
import { MapPin } from 'lucide-react';

const countries = ['Todos', 'Colombia', 'México', 'Argentina', 'España', 'Venezuela', 'Chile'];

const countryFlags: Record<string, string> = {
  Colombia: '🇨🇴',
  México: '🇲🇽',
  Argentina: '🇦🇷',
  España: '🇪🇸',
  Venezuela: '🇻🇪',
  Chile: '🇨🇱',
};

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

export default function CountrySection() {
  const [activeCountry, setActiveCountry] = useState('Todos');
  const [allStories, setAllStories] = useState<Story[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('relatos')
      .select('id, titulo, extracto, cuerpo, tags, pais, categoria, imagen_url, vistas, likes, estado, tiempo_lectura, created_at, autor_id')
      .in('estado', ['publicado', 'published'])
      .order('created_at', { ascending: false })
      .limit(60)
      .then(({ data }) => {
        if (data) setAllStories((data as RelatoRow[]).map(mapToStory));
      });
  }, []);

  const filtered = useMemo(() => {
    if (activeCountry === 'Todos') return allStories.slice(0, 6);
    return allStories.filter((s) => s.country === activeCountry).slice(0, 6);
  }, [allStories, activeCountry]);

  if (allStories.length === 0) return null;

  return (
    <section className="py-20 max-w-screen-2xl mx-auto px-6 lg:px-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={16} className="text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Por País</span>
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-6">
          Historias de <span className="text-gradient-gold italic">toda Latinoamérica</span>
        </h2>

        <div className="flex flex-wrap gap-2">
          {countries.map((country) => (
            <button
              key={`country-tab-${country}`}
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
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-5">
          {filtered.map((story) => (
            <StoryCard key={`country-story-${story.id}`} story={story} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="font-display text-xl text-muted-foreground">
            Próximamente relatos de {activeCountry}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Estamos invitando autoras de esta región. ¿Eres escritora?
          </p>
          <Link href="/sign-up-login-screen" className="btn-primary mt-4 inline-flex">
            Publicar mi relato
          </Link>
        </div>
      )}
    </section>
  );
}
