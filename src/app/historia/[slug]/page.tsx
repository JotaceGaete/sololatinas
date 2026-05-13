import { redirect } from 'next/navigation';
import { getRelatoBySlug, getPublishedCapitulosByRelatoId } from '@/lib/supabase/queries';
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

  const capitulos = await getPublishedCapitulosByRelatoId(story.id);

  // No chapters at all → fall back to the immersive reader
  if (!story.hasChapters) {
    redirect(`/immersive-reading-mode?id=${story.id}`);
  }

  // Story has chapters but none published yet → show empty state (not a redirect)
  return <HistoriaIndexClient story={story} capitulos={capitulos} />;
}
