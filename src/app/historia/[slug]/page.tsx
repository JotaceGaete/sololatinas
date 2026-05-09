import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookOpen, Hash } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import AppImage from '@/components/ui/AppImage';
import ChapterList from '@/components/ui/ChapterList';
import { createClient } from '@/lib/supabase/server';
import type { Historia, HistoriaCapitulo } from '@/types/historias';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('historias')
    .select('titulo, descripcion')
    .eq('slug', slug)
    .single();
  if (!data) return { title: 'Historia no encontrada' };
  return {
    title: `${data.titulo} — SoloLatinas`,
    description: data.descripcion ?? undefined,
  };
}

export default async function HistoriaSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: historia, error } = await supabase
    .from('historias')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !historia) notFound();

  const h = historia as Historia;

  const { data: capitulos } = await supabase
    .from('historia_capitulos')
    .select('id, historia_id, numero, titulo, cuerpo_html, estado, published_at, created_at, updated_at')
    .eq('historia_id', h.id)
    .eq('estado', 'publicado')
    .order('numero', { ascending: true });

  const caps = (capitulos as HistoriaCapitulo[]) ?? [];
  const firstCap = caps[0] ?? null;

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-noir pt-16">
        {/* Hero portada */}
        <div className="relative h-72 md:h-96 overflow-hidden">
          {h.portada_url?.trim() ? (
            <AppImage
              src={h.portada_url}
              alt={`Portada: ${h.titulo}`}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,rgba(201,169,110,0.35),transparent_50%),linear-gradient(135deg,#2C1F0E,#0D0B0A)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/60 to-noir/20" />
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-6 lg:px-8 -mt-24 relative z-10 pb-20">
          {/* Badge */}
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent/20 text-accent border border-accent/30">
              <BookOpen size={10} />
              Historia serializada
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display text-4xl md:text-5xl font-bold text-cream leading-tight mb-4">
            {h.titulo}
          </h1>

          {/* Description */}
          {h.descripcion && (
            <p className="text-muted-foreground leading-relaxed mb-8 max-w-xl">
              {h.descripcion}
            </p>
          )}

          {/* Stats + CTA */}
          <div className="flex flex-wrap items-center gap-4 mb-12">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Hash size={14} />
              {caps.length} {caps.length === 1 ? 'capítulo' : 'capítulos'} publicados
            </span>

            {firstCap && (
              <Link
                href={`/historia/${slug}/capitulo/${firstCap.numero}`}
                className="btn-primary px-6 py-2.5 text-sm"
              >
                Continuar leyendo
              </Link>
            )}
          </div>

          {/* Divider */}
          <div className="gold-divider mb-8" />

          {/* Chapter list */}
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-primary" />
              Capítulos
            </h2>
            <ChapterList capitulos={caps} historiaSlug={slug} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
