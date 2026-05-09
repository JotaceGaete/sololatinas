'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { Menu, X, BookOpen, Search, PenLine, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const navLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'Relatos', href: '/stories-library' },
  { label: 'Autores', href: '/authors-page' },
  { label: 'Mis Relatos', href: '/mis-relatos' },
  { label: 'Comunidad', href: '#comunidad' },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#user-menu-btn') && !target.closest('#user-menu')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [userMenuOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setUserMenuOpen(false);
      setMobileOpen(false);
      toast.success('Sesión cerrada');
      router.push('/');
      router.refresh();
    } catch {
      toast.error('Error al cerrar sesión');
    }
  };

  const userInitial = user?.email?.[0]?.toUpperCase() ?? '?';
  const userLabel = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Mi cuenta';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-noir/95 backdrop-blur-md border-b border-border' : 'bg-transparent'
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
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={`nav-${link.href}`}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button className="btn-ghost p-2 hidden md:flex" aria-label="Buscar relatos">
              <Search size={18} />
            </button>

            {/* Write button — always visible when logged in */}
            {user && (
              <Link
                href="/escribir-relato"
                className="hidden md:inline-flex items-center gap-1.5 text-xs py-2 px-4 rounded-md border border-primary/50 text-primary hover:bg-primary/10 transition-all font-medium"
              >
                <PenLine size={14} />
                Escribir
              </Link>
            )}

            {/* Auth section */}
            {loading ? (
              // Skeleton while session loads — prevents flash
              <div className="hidden md:block w-8 h-8 rounded-full bg-white/10 animate-pulse" />
            ) : user ? (
              // ── Authenticated ──────────────────────────────────────────────
              <div className="relative hidden md:block">
                <button
                  id="user-menu-btn"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-border hover:border-primary/40 hover:bg-white/5 transition-all"
                  aria-label="Menú de usuario"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{userInitial}</span>
                  </div>
                  <span className="text-xs text-muted-foreground max-w-[80px] truncate hidden lg:block">
                    {userLabel}
                  </span>
                  <ChevronDown size={12} className="text-muted-foreground" />
                </button>

                {userMenuOpen && (
                  <div
                    id="user-menu"
                    className="absolute right-0 top-11 w-48 bg-surface-elevated border border-border rounded-xl shadow-xl py-1 z-50 animate-fade-up"
                  >
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-xs font-semibold text-foreground truncate">{userLabel}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/mis-relatos"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                    >
                      <BookOpen size={13} />
                      Mis Relatos
                    </Link>
                    <Link
                      href="/escribir-relato"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                    >
                      <PenLine size={13} />
                      Escribir Relato
                    </Link>
                    <div className="border-t border-border mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={13} />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // ── Not authenticated ──────────────────────────────────────────
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
              <button onClick={() => setMobileOpen(false)} className="btn-ghost p-1" aria-label="Cerrar menú">
                <X size={20} />
              </button>
            </div>

            {/* User info in mobile when authenticated */}
            {user && (
              <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-primary/10 border border-primary/20">
                <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{userInitial}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{userLabel}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            )}

            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={`mobile-nav-${link.href}`}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`px-4 py-3 text-sm font-medium rounded-md transition-all ${
                      isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    {link.label}
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

              {user ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-md border border-red-400/40 text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
                >
                  <LogOut size={16} />
                  Cerrar sesión
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
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
