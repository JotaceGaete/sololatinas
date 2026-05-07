import React from 'react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import AuthorsPageClient from './components/AuthorsPageClient';

export default function AuthorsPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <AuthorsPageClient />
      <SiteFooter />
    </main>
  );
}