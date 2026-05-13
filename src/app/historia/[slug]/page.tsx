import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import { getRelatoBySlug, getPublishedCapitulosByRelatoId } from '@/lib/supabase/queries';
import HistoriaIndexClient from './components/HistoriaIndexClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function HistoriaPage({ params }: Props) {
  const { slug } = await params;

  console.log('[HistoriaPage] slug:', slug);

  const story = await getRelatoBySlug(slug);

  console.log('[HistoriaPage] story?.id:', story?.id ?? 'NOT FOUND');

  if (!story) {
    notFound();
  }

  const capitulos = await getPublishedCapitulosByRelatoId(story.id);

  console.log('[HistoriaPage] capítulos publicados encontrados:', capitulos.length);

  // Relato without the chapters feature → immersive reader
  if (story.hasChapters === false) {
    redirect(`/immersive-reading-mode?id=${story.id}`);
  }

  // Show index page — HistoriaIndexClient handles the 0-chapters empty state
  return <HistoriaIndexClient story={story} capitulos={capitulos} />;
}
