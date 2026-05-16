

import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseRelato } from '@/lib/supabase/mappers';
import EditarRelatoClient from './components/EditarRelatoClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarRelatoPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-up-login-screen');

  const { data: relato } = await supabase
    .from('relatos')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!relato) notFound();

  const r = relato as SupabaseRelato;
  const owner = r.autor_id;
  if (owner !== user.id) redirect('/mis-relatos');

  return (
    <EditarRelatoClient
      userId={user.id}
      relato={{
        id: r.id,
        titulo: (r.titulo ?? r.title ?? '') as string,
        cuerpo: (r.cuerpo ?? r.content ?? '') as string,
        extracto: (r.extracto ?? r.resumen ?? r.excerpt ?? '') as string,
        tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
        pais: (r.pais ?? '') as string,
        categoria: (r.categoria ?? '') as string,
        imagen_url: (r.cover_image_url ?? r.portada_url ?? r.imagen_url ?? '') as string,
        estado: (r.estado ?? r.status ?? 'borrador') as string,
      }}
    />
  );
}
