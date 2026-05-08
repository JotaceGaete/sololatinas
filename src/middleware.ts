import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

function buildExpectedToken(): string | null {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return null;
  return createHmac('sha256', secret).update('admin_authenticated').digest('hex');
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin-panel')) {
    const token = req.cookies.get('admin_token')?.value;
    const expected = buildExpectedToken();

    const isValid = expected && token === expected;

    if (!isValid) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/admin-login';
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin-panel/:path*'],
};
