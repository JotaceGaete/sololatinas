import React from 'react';
import Link from 'next/link';
import { BookOpen, PenLine } from 'lucide-react';

export default function CtaBanner() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-screen-2xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-surface-elevated">
          {/* Decorative gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <div className="relative z-10 px-8 lg:px-16 py-16 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-3">
                ¿Tienes una historia{' '}
                <span className="text-gradient-gold italic">que contar</span>?
              </h2>
              <p className="text-muted-foreground text-base max-w-lg leading-relaxed">
                Únete a nuestra comunidad de autoras latinas y comparte tu voz con miles de lectoras que están esperando tu historia.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <Link href="/sign-up-login-screen" className="btn-primary px-8 py-3">
                <PenLine size={16} />
                Publicar mi relato
              </Link>
              <Link href="/stories-library" className="btn-outline px-8 py-3">
                <BookOpen size={16} />
                Seguir leyendo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}