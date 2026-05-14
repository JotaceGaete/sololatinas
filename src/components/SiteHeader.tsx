'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { Menu, X, BookOpen, Search, User, Heart, PenLine, LogOut, BookMarked, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleWriteClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      router.push('/sign-up-login-screen?redirect=/escribir-relato');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUserMenuOpen(false);
      setMobileOpen(false);
      toast.success('Sesión cerrada correctamente');
      router.push('/');
    } catch {
      toast.error('Error al cerrar sesión');
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const initials = displayName.slice(0, 2).toUpperCase();

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
              onClick={handleWriteClick}
              className="hidden md:inline-flex items-center gap-1.5 text-xs py-2 px-4 rounded-md border border-primary/50 text-primary hover:bg-primary/10 transition-all font-medium"
            >
              <PenLine size={14} />
              Escribir
            </Link>

            {/* Auth section — desktop */}
            {!loading && (
              user ? (
                /* User menu */
                <div className="relative hidden md:block" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(v => !v)}
                    className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-white/5 transition-all"
                    aria-label="Menú de usuario"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <span className="text-xs text-foreground font-medium max-w-[80px] truncate hidden lg:block">
                      {displayName}
                    </span>
                    <ChevronDown size={12} className={`text-muted-foreground transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-surface-elevated border border-border rounded-xl shadow-xl overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/mis-relatos"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                        >
                          <BookMarked size={14} />
                          Mis Relatos
                        </Link>
                        <Link
                          href="/escribir-relato"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                        >
                          <PenLine size={14} />
                          Escribir Relato
                        </Link>
                        <div className="my-1 border-t border-border" />
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all"
                        >
                          <LogOut size={14} />
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
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
                </>
              )
            )}

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

            {/* Mobile user info */}
            {!loading && user && (
              <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-surface-elevated border border-border">
                <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            )}

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
                onClick={(e) => { handleWriteClick(e); if (user) setMobileOpen(false); }}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-md border border-primary/50 text-primary hover:bg-primary/10 transition-all font-medium text-sm"
              >
                <PenLine size={16} />
                Escribir Relato
              </Link>

              {!loading && (
                user ? (
                  <button
                    onClick={handleSignOut}
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-md border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all font-medium text-sm"
                  >
                    <LogOut size={16} />
                    Cerrar Sesión
                  </button>
                ) : (
                  <>
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
                  </>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
