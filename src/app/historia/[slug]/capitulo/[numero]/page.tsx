

import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import { getRelatoBySlug, getPublishedCapitulosByRelatoId } from '@/lib/supabase/queries';
import { buildInitialStoryChapter, shiftStoredChaptersAfterInitial } from '@/lib/stories/chapters';
import ChapterReaderClient from './components/ChapterReaderClient';

interface Props {
  params: Promise<{ slug: string; numero: string }>;
}

export default async function CapituloPage({ params }: Props) {
  const { slug, numero: numeroStr } = await params;
  const numero = parseInt(numeroStr, 10);

  console.log('[CapituloPage] slug:', slug, 'numero:', numero);

  if (isNaN(numero) || numero < 1) {
    redirect(`/historia/${slug}`);
  }

  const story = await getRelatoBySlug(slug);

  console.log('[CapituloPage] story?.id:', story?.id ?? 'NOT FOUND');

  if (!story) {
    notFound();
  }

  const publishedStoredCapitulos = await getPublishedCapitulosByRelatoId(story.id);
  const initialChapter = buildInitialStoryChapter(story);
  const allCapitulos = initialChapter
    ? [initialChapter, ...shiftStoredChaptersAfterInitial(publishedStoredCapitulos)]
    : publishedStoredCapitulos;
  const capitulo = allCapitulos.find((item) => item.numero === numero) ?? null;

  console.log('[CapituloPage] capítulo encontrado:', capitulo?.id ?? 'NOT FOUND');
  console.log('[CapituloPage] total capítulos publicados:', allCapitulos.length);

  // Chapter not found or unpublished (no publishedAt) → back to story index
  if (!capitulo || !capitulo.publishedAt) {
    redirect(`/historia/${slug}`);
  }

  return <ChapterReaderClient story={story} capitulo={capitulo} allCapitulos={allCapitulos} />;
}
