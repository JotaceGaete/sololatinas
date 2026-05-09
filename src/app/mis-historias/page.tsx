import React from 'react';
import type { Metadata } from 'next';
import MisHistoriasClient from './components/MisHistoriasClient';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import AuthGuard from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'Mis Historias — SoloLatinas',
  description: 'Gestiona tus historias serializadas por capítulos.',
};

export default function MisHistoriasPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-noir pt-16">
        <AuthGuard>
          <MisHistoriasClient />
        </AuthGuard>
      </main>
      <SiteFooter />
    </>
  );
}
