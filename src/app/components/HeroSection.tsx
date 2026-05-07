import React from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import { BookOpen, ChevronRight, Star } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <AppImage
          src="https://img.rocket.new/generatedImages/rocket_gen_img_18ce450e0-1771886292147.png"
          alt="Mujer latina leyendo en habitación con iluminación cálida y dorada, atmósfera romántica y literaria"
          fill
          priority
          className="object-cover object-center" />
        
        <div className="absolute inset-0 bg-gradient-to-r from-noir/95 via-noir/75 to-noir/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-noir/80 via-transparent to-noir/20" />
      </div>
      {/* Content */}
      <div className="relative z-10 max-w-screen-2xl mx-auto px-6 lg:px-10 pt-20 pb-16 w-full">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5]?.map((i) =>
              <Star key={`hero-star-${i}`} size={12} className="text-primary fill-primary" />
              )}
            </div>
            <span className="text-xs text-primary font-semibold tracking-widest uppercase">
              Literatura Romántica Latina Premium
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl lg:text-6xl xl:text-7xl font-bold text-cream leading-[1.1] hero-text-shadow mb-4">
            Relatos que{' '}
            <span className="text-gradient-gold italic">despiertan</span>
            <br />
            la imaginación
          </h1>

          <div className="gold-divider w-24 my-6" />

          <p className="text-lg text-cream/75 leading-relaxed mb-8 max-w-lg font-light">
            Una biblioteca íntima de historias románticas y apasionadas escritas por las voces más sensuales de la literatura latina contemporánea.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mb-12">
            <Link href="/stories-library" className="btn-primary px-8 py-3 text-sm">
              <BookOpen size={16} />
              Explorar Relatos
            </Link>
            <Link href="/sign-up-login-screen" className="btn-outline px-8 py-3 text-sm">
              Leer Gratis
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* Social Proof */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-cream/60">
            <div>
              <span className="font-display text-xl font-bold text-primary">+240</span>
              <span className="ml-1.5">relatos</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div>
              <span className="font-display text-xl font-bold text-primary">+38</span>
              <span className="ml-1.5">autoras</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div>
              <span className="font-display text-xl font-bold text-primary">7 países</span>
            </div>
          </div>
        </div>
      </div>
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <div className="w-px h-8 bg-gradient-to-b from-transparent to-primary/60" />
        <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
      </div>
    </section>);

}