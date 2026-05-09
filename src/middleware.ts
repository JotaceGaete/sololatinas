import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// ── Admin routes — HMAC cookie (Web Crypto, Edge-compatible) ──────────────────

async function buildAdminToken(): Promise<string | null> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return null;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('admin_authenticated'));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function isAdminAuthenticated(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('admin_token')?.value;
  if (!token) return false;
  const expected = await buildAdminToken();
  return !!(expected && token === expected);
}

// ── User routes — Supabase session ────────────────────────────────────────────

const PROTECTED_USER_PATHS = ['/escribir-relato', '/mis-relatos'];

async function getSupabaseUser(req: NextRequest, res: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ── Middleware ────────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin-panel')) {
    if (!(await isAdminAuthenticated(req))) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/admin-login';
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  const isProtected = PROTECTED_USER_PATHS.some((p) => pathname.startsWith(p));
  if (isProtected) {
    const res = NextResponse.next({ request: req });
    const user = await getSupabaseUser(req, res);
    if (!user) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/sign-up-login-screen';
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin-panel/:path*',
    '/escribir-relato/:path*',
    '/mis-relatos/:path*',
  ],
};
