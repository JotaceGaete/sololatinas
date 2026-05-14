import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith('/admin-panel');
  const isWriterRoute = pathname.startsWith('/escribir-relato');

  if (!isAdminRoute && !isWriterRoute) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/sign-up-login-screen', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute) {
    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', user.email)
      .maybeSingle();

    if (!adminRecord) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin-panel', '/admin-panel/:path*', '/escribir-relato', '/escribir-relato/:path*'],
};
