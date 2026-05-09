import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

function buildToken(secret: string): string {
  return createHmac('sha256', secret).update('admin_authenticated').digest('hex');
}

function safeCompare(a?: string | null, b?: string | null): boolean {
  const aBuf = Buffer.from(a ?? '');
  const bBuf = Buffer.from(b ?? '');

  if (aBuf.length !== bBuf.length) {
    return false;
  }

  return timingSafeEqual(aBuf, bBuf);
}

export async function POST(req: NextRequest) {
  const { user, password } = await req.json();

  const adminUser = process.env.ADMIN_USER;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminSecret = process.env.ADMIN_SECRET;

  console.log('ADMIN_LOGIN_ENV_CHECK', {
    hasAdminUser: Boolean(adminUser),
    hasAdminPassword: Boolean(adminPassword),
    hasAdminSecret: Boolean(adminSecret),
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasSupabaseAnon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  });

  if (!adminUser || !adminPassword || !adminSecret) {
    const missing = [
      !adminUser && 'ADMIN_USER',
      !adminPassword && 'ADMIN_PASSWORD',
      !adminSecret && 'ADMIN_SECRET',
    ].filter(Boolean).join(', ');
    return NextResponse.json(
      { error: `Servidor no configurado: falta ${missing}` },
      { status: 500 }
    );
  }

  const userMatch = safeCompare(user, adminUser);
  const passMatch = safeCompare(password, adminPassword);

  if (!userMatch || !passMatch) {
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
  }

  const token = buildToken(adminSecret);

  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  });

  return res;
}
