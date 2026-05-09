import React from 'react';
import type { Metadata } from 'next';
import EscribirHistoriaClient from './components/EscribirHistoriaClient';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import AuthGuard from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'Escribir Historia — SoloLatinas',
  description: 'Crea una historia serializada por capítulos. Publica por entregas y mantén a tus lectores al pendiente.',
};

export default function EscribirHistoriaPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-noir pt-16">
        <AuthGuard>
          <EscribirHistoriaClient />
        </AuthGuard>
      </main>
      <SiteFooter />
    </>
  );
}
