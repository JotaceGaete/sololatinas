import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Clock } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import AppImage from '@/components/ui/AppImage';
import { createClient } from '@/lib/supabase/server';
import type { Historia, HistoriaCapitulo } from '@/types/historias';

export const metadata: Metadata = {
  title: 'Historias — SoloLatinas',
  description: 'Novelas y cuentos serializados por capítulos. Lee las mejores historias románticas latinas por entregas.',
};

type HistoriaConConteo = Historia & { historia_capitulos: Pick<HistoriaCapitulo, 'id'>[] };

export default async function HistoriasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('historias')
    .select('*, historia_capitulos(id)')
    .eq('estado', 'publicada')
    .order('created_at', { ascending: false });

  const historias = (data as HistoriaConConteo[]) ?? [];

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-noir pt-16">
        {/* Header */}
        <div className="bg-surface border-b border-border px-6 lg:px-10 py-10 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} className="text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Historias serializadas
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">
            Historias por <span className="text-gradient-gold italic">capítulos</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Novelas y cuentos largos publicados por entregas. Sigue a tus autoras favoritas.
          </p>
        </div>

        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 py-12">
          {historias.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-5">
                <BookOpen size={28} className="text-muted-foreground/40" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                Pronto habrá historias aquí
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm mb-8">
                Las primeras historias serializadas están en camino.
              </p>
              <Link href="/stories-library" className="btn-primary px-6 py-3">
                Ver relatos cortos
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {historias.map((h) => {
                const capCount = h.historia_capitulos?.length ?? 0;
                const href = h.slug ? `/historia/${h.slug}` : null;

                const card = (
                  <div className="story-card group cursor-pointer">
                    {/* Cover */}
                    <div className="relative h-52 overflow-hidden bg-noir">
                      {h.portada_url?.trim() ? (
                        <AppImage
                          src={h.portada_url}
                          alt={`Portada: ${h.titulo}`}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_20%,rgba(201,169,110,0.26),transparent_34%),linear-gradient(135deg,#2C1F0E,#0D0B0A)]">
                          <BookOpen size={36} className="text-primary/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 overlay-dark" />
                      <div className="absolute top-3 left-3">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-accent/20 text-accent border border-accent/30">
                          Historia
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 flex items-center gap-1 text-cream/70 text-xs">
                        <BookOpen size={11} />
                        {capCount} cap.
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-4">
                      <h2 className="font-display text-base font-semibold text-foreground leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">
                        {h.titulo}
                      </h2>
                      {h.descripcion && (
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                          {h.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                );

                return (
                  <div key={h.id}>
                    {href ? <Link href={href}>{card}</Link> : card}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
