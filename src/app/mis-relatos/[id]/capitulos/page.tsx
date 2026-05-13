import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCapitulosByRelatoId } from '@/lib/supabase/queries';
import { mapRelatoToStory } from '@/lib/supabase/mappers';
import type { SupabaseRelato } from '@/lib/supabase/mappers';
import CapitulosManagerClient from './components/CapitulosManagerClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CapitulosPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-up-login-screen');

  const { data: relato } = await supabase
    .from('relatos')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!relato) redirect('/mis-relatos');

  const owner = (relato as SupabaseRelato).autor_id ?? (relato as SupabaseRelato).author_id;
  if (owner !== user.id) redirect('/mis-relatos');

  const story = mapRelatoToStory(relato as SupabaseRelato);
  const capitulos = await getCapitulosByRelatoId(id);

  return (
    <CapitulosManagerClient
      story={story}
      initialCapitulos={capitulos}
      userId={user.id}
    />
  );
}
