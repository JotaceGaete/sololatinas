'use client';

import React from 'react';
import Link from 'next/link';
import { Users, PenLine } from 'lucide-react';

export default function AuthorsPageClient() {
  return (
    <div className="pt-20 min-h-screen">
      <div className="bg-surface border-b border-border px-6 lg:px-10 py-10 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <Users size={16} className="text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Comunidad de Autoras</span>
        </div>
        <h1 className="font-display text-4xl font-bold text-foreground mb-2">
          Las <span className="text-gradient-gold italic">voces</span> detrás de los relatos
        </h1>
        <p className="text-muted-foreground text-sm">
          Nuestras autoras comparten su talento con la comunidad
        </p>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 py-20">
        <div className="flex flex-col items-center justify-center text-center py-16 bg-surface border border-border rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
            <Users size={28} className="text-primary/60" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">
            Perfiles de autoras próximamente
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-8">
            Estamos preparando los perfiles públicos de nuestras autoras. Mientras tanto, puedes leer sus relatos en la biblioteca.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/stories-library" className="btn-primary inline-flex items-center gap-2 px-6 py-3">
              <PenLine size={16} />
              Explorar relatos
            </Link>
            <Link href="/sign-up-login-screen" className="btn-outline inline-flex items-center gap-2 px-6 py-3">
              Registrarme como autora
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
