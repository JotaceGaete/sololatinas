import { createHmac, createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

function sha256Hex(value: string | Uint8Array) {
  return createHash('sha256').update(value).digest('hex');
}

function hmac(key: Buffer | Uint8Array | string, value: string) {
  return createHmac('sha256', key).update(value).digest();
}

function encodePath(path: string) {
  return path
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
}

function publicUrlFor(key: string) {
  const base = process.env.R2_PUBLIC_URL?.trim().replace(/\/+$/, '');
  if (!base) return '';
  return `${base}/${encodePath(key)}`;
}

function extensionFrom(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const endpoint = process.env.R2_ENDPOINT?.trim().replace(/\/+$/, '');
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !process.env.R2_PUBLIC_URL) {
    return NextResponse.json({ error: 'R2 is not configured' }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const userId = String(formData.get('userId') ?? 'anonymous').replace(/[^a-zA-Z0-9_-]/g, '');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only images are allowed' }, { status: 400 });
  }

  const body = new Uint8Array(await file.arrayBuffer());
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';
  const key = `covers/${userId || 'anonymous'}/${Date.now()}.${extensionFrom(file)}`;
  const url = new URL(`${endpoint}/${bucket}/${encodePath(key)}`);
  const payloadHash = sha256Hex(body);
  const host = url.host;
  const canonicalUri = url.pathname;
  const canonicalHeaders = [
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ].join('\n') + '\n';
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = [
    'PUT',
    canonicalUri,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${secretAccessKey}`, dateStamp), region), service),
    'aws4_request'
  );
  const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(', ');

  const uploadResponse = await fetch(url, {
    method: 'PUT',
    body,
    headers: {
      Authorization: authorization,
      'Content-Type': file.type || 'application/octet-stream',
      'X-Amz-Content-Sha256': payloadHash,
      'X-Amz-Date': amzDate,
    },
  });

  if (!uploadResponse.ok) {
    return NextResponse.json({ error: 'R2 upload failed' }, { status: 502 });
  }

  return NextResponse.json({ key, publicUrl: publicUrlFor(key) });
}
