import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createServerClient } from '@supabase/ssr';

// ── Admin routes — HMAC cookie ────────────────────────────────────────────────

function buildAdminToken(): string | null {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return null;
  return createHmac('sha256', secret).update('admin_authenticated').digest('hex');
}

function isAdminAuthenticated(req: NextRequest): boolean {
  const token = req.cookies.get('admin_token')?.value;
  const expected = buildAdminToken();
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
          // Propagate any refreshed session cookies to both request and response
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

  // Admin panel — HMAC cookie check (synchronous, fast)
  if (pathname.startsWith('/admin-panel')) {
    if (!isAdminAuthenticated(req)) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/admin-login';
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Protected user routes — Supabase session check
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

    // Return res so any refreshed session cookies are forwarded to the browser
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
