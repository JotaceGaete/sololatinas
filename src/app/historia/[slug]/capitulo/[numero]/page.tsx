import { redirect } from 'next/navigation';
import { getRelatoBySlug, getPublishedCapitulosByRelatoId, getCapituloByNumero } from '@/lib/supabase/queries';
import ChapterReaderClient from './components/ChapterReaderClient';

interface Props {
  params: Promise<{ slug: string; numero: string }>;
}

export default async function CapituloPage({ params }: Props) {
  const { slug, numero: numeroStr } = await params;
  const numero = parseInt(numeroStr, 10);

  if (isNaN(numero) || numero < 1) {
    redirect(`/historia/${slug}`);
  }

  const story = await getRelatoBySlug(slug);
  if (!story) redirect('/stories-library');

  const [capitulo, allCapitulos] = await Promise.all([
    getCapituloByNumero(story.id, numero),
    getPublishedCapitulosByRelatoId(story.id),
  ]);

  if (!capitulo) redirect(`/historia/${slug}`);

  return (
    <ChapterReaderClient
      story={story}
      capitulo={capitulo}
      allCapitulos={allCapitulos}
    />
  );
}
