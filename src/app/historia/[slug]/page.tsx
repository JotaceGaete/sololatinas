import { redirect } from 'next/navigation';
import { getRelatoBySlug, getCapitulosByRelatoId } from '@/lib/supabase/queries';
import HistoriaIndexClient from './components/HistoriaIndexClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function HistoriaPage({ params }: Props) {
  const { slug } = await params;

  const story = await getRelatoBySlug(slug);

  // Unknown slug: redirect to library
  if (!story) {
    redirect('/stories-library');
  }

  const capitulos = await getCapitulosByRelatoId(story.id);

  // No chapters → fall back to the immersive reader
  if (capitulos.length === 0) {
    redirect(`/immersive-reading-mode?id=${story.id}`);
  }

  return <HistoriaIndexClient story={story} capitulos={capitulos} />;
}
