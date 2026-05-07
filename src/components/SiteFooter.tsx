import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { Heart as HeartIcon } from 'lucide-react';

const InstagramIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
  </svg>
);

const TwitterIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export default function SiteFooter() {
  return (
    <footer className="bg-surface border-t border-border mt-20">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <AppLogo size={36} />
              <span className="font-display text-xl font-semibold text-gradient-gold">SoloLatinas</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              La biblioteca más elegante de literatura romántica latina. Historias que despiertan la imaginación, escritas con pasión y autenticidad.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a
                href="#"
                className="p-2 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
                aria-label="Instagram"
              >
                <InstagramIcon size={16} />
              </a>
              <a
                href="#"
                className="p-2 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
                aria-label="Twitter"
              >
                <TwitterIcon size={16} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Explorar</h4>
            <ul className="space-y-2">
              {[
                { label: 'Relatos', href: '/stories-library' },
                { label: 'Autores', href: '/authors-page' },
                { label: 'Más Leídos', href: '/stories-library' },
                { label: 'Nuevos Relatos', href: '/stories-library' },
              ]?.map((item) => (
                <li key={`footer-explore-${item?.href}-${item?.label}`}>
                  <Link
                    href={item?.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item?.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              {['Términos de Uso', 'Privacidad', 'Contenido para Adultos', 'Contacto']?.map((item) => (
                <li key={`footer-legal-${item}`}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="gold-divider mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2026 SoloLatinas.com — Solo para mayores de 18 años</p>
          <p className="flex items-center gap-1">
            Hecho con <HeartIcon size={12} className="text-accent" /> para la comunidad latina
          </p>
        </div>
      </div>
    </footer>
  );
}