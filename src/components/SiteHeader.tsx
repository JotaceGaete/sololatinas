'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { Menu, X, BookOpen, Search, User, Heart, PenLine } from 'lucide-react';

const navLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'Relatos', href: '/stories-library' },
  { label: 'Autores', href: '/authors-page' },
  { label: 'Mis Relatos', href: '/mis-relatos' },
  { label: 'Comunidad', href: '#comunidad' },
  { label: 'Tienda', href: '#tienda' },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-noir/95 backdrop-blur-md border-b border-border' :'bg-transparent'
        }`}
      >
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <AppLogo size={32} />
            <span className="font-display text-xl font-semibold text-gradient-gold tracking-wide hidden sm:block">
              SoloLatinas
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks?.map((link) => {
              const isActive = pathname === link?.href;
              return (
                <Link
                  key={`nav-${link?.href}`}
                  href={link?.href}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    isActive
                      ? 'text-primary bg-primary/10' :'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  {link?.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button
              className="btn-ghost p-2 hidden md:flex"
              aria-label="Buscar relatos"
            >
              <Search size={18} />
            </button>
            <button
              className="btn-ghost p-2 hidden md:flex"
              aria-label="Favoritos"
            >
              <Heart size={18} />
            </button>
            <Link
              href="/escribir-relato"
              className="hidden md:inline-flex items-center gap-1.5 text-xs py-2 px-4 rounded-md border border-primary/50 text-primary hover:bg-primary/10 transition-all font-medium"
            >
              <PenLine size={14} />
              Escribir
            </Link>
            <Link
              href="/sign-up-login-screen"
              className="btn-outline hidden md:inline-flex text-xs py-2 px-4"
            >
              <User size={14} />
              Entrar
            </Link>
            <Link
              href="/sign-up-login-screen"
              className="btn-primary hidden md:inline-flex text-xs py-2 px-4"
            >
              <BookOpen size={14} />
              Leer Gratis
            </Link>
            <button
              className="btn-ghost p-2 md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>
      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] flex animate-fade-in">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative ml-auto w-72 h-full bg-surface border-l border-border flex flex-col p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-8">
              <span className="font-display text-lg text-gradient-gold">SoloLatinas</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="btn-ghost p-1"
                aria-label="Cerrar menú"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {navLinks?.map((link) => {
                const isActive = pathname === link?.href;
                return (
                  <Link
                    key={`mobile-nav-${link?.href}`}
                    href={link?.href}
                    onClick={() => setMobileOpen(false)}
                    className={`px-4 py-3 text-sm font-medium rounded-md transition-all ${
                      isActive
                        ? 'text-primary bg-primary/10' :'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    {link?.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto flex flex-col gap-3">
              <Link
                href="/escribir-relato"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-md border border-primary/50 text-primary hover:bg-primary/10 transition-all font-medium text-sm"
              >
                <PenLine size={16} />
                Escribir Relato
              </Link>
              <Link
                href="/sign-up-login-screen"
                onClick={() => setMobileOpen(false)}
                className="btn-outline w-full justify-center"
              >
                Entrar
              </Link>
              <Link
                href="/sign-up-login-screen"
                onClick={() => setMobileOpen(false)}
                className="btn-primary w-full justify-center"
              >
                Leer Gratis
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}