import React from 'react';
import type { Metadata } from 'next';
import EscribirRelatoClient from './components/EscribirRelatoClient';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Escribir Relato — SoloLatinas',
  description: 'Comparte tu historia romántica latina con nuestra comunidad. Editor de texto rico, etiquetas, imagen de portada y más.',
};

export default function EscribirRelatoPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-noir pt-16">
        <EscribirRelatoClient />
      </main>
      <SiteFooter />
    </>
  );
}
