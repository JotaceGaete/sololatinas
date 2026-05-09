import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import CapituloReaderClient from './components/CapituloReaderClient';
import { createClient } from '@/lib/supabase/server';
import { sanitizeStoryHtml } from '@/lib/relato-display';
import type { Historia, HistoriaCapitulo } from '@/types/historias';

interface PageProps {
  params: Promise<{ slug: string; numero: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, numero } = await params;
  const supabase = await createClient();
  const { data: h } = await supabase
    .from('historias')
    .select('titulo, slug')
    .eq('slug', slug)
    .single();
  if (!h) return { title: 'Capítulo no encontrado' };
  const { data: cap } = await supabase
    .from('historia_capitulos')
    .select('titulo')
    .eq('historia_id', (h as Historia).id)
    .eq('numero', parseInt(numero, 10))
    .single();
  const titulo = (cap as Pick<HistoriaCapitulo, 'titulo'> | null)?.titulo;
  return {
    title: `${titulo ?? `Capítulo ${numero}`} — ${h.titulo} — SoloLatinas`,
  };
}

export default async function CapituloPage({ params }: PageProps) {
  const { slug, numero: numeroStr } = await params;
  const numero = parseInt(numeroStr, 10);
  if (isNaN(numero) || numero < 1) notFound();

  const supabase = await createClient();

  // Historia
  const { data: historiaData, error: hErr } = await supabase
    .from('historias')
    .select('id, titulo, slug, descripcion, portada_url, autor_id, estado, created_at, updated_at')
    .eq('slug', slug)
    .single();
  if (hErr || !historiaData) notFound();
  const historia = historiaData as Historia;

  // Capítulo actual
  const { data: capData, error: cErr } = await supabase
    .from('historia_capitulos')
    .select('*')
    .eq('historia_id', historia.id)
    .eq('numero', numero)
    .single();
  if (cErr || !capData) notFound();
  const capitulo = capData as HistoriaCapitulo;

  // Todos los capítulos publicados (para nav)
  const { data: todosData } = await supabase
    .from('historia_capitulos')
    .select('id, historia_id, numero, titulo, cuerpo_html, estado, published_at, created_at, updated_at')
    .eq('historia_id', historia.id)
    .eq('estado', 'publicado')
    .order('numero', { ascending: true });
  const todos = (todosData as HistoriaCapitulo[]) ?? [];

  const idx = todos.findIndex((c) => c.numero === numero);
  const prev = idx > 0 ? todos[idx - 1] : null;
  const next = idx >= 0 && idx < todos.length - 1 ? todos[idx + 1] : null;

  const sanitizedHtml = sanitizeStoryHtml(capitulo.cuerpo_html);

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-noir pt-16">
        <CapituloReaderClient
          historia={historia}
          capitulo={capitulo}
          sanitizedHtml={sanitizedHtml}
          prev={prev ? { numero: prev.numero, titulo: prev.titulo } : null}
          next={next ? { numero: next.numero, titulo: next.titulo } : null}
          totalCapitulos={todos.length}
        />
      </main>
      <SiteFooter />
    </>
  );
}
