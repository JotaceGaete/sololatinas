import { NextResponse } from 'next/server';

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

async function sha256Hex(data: Uint8Array | string): Promise<string> {
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
}

async function hmacHex(key: ArrayBuffer | Uint8Array, message: string): Promise<string> {
  const result = await hmacSha256(key, message);
  return Array.from(new Uint8Array(result))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function POST(request: Request) {
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
  const payloadHash = await sha256Hex(body);
  const host = url.host;
  const canonicalUri = url.pathname;
  const canonicalHeaders =
    `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
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
    await sha256Hex(canonicalRequest),
  ].join('\n');

  let signingKey: ArrayBuffer = new TextEncoder().encode(`AWS4${secretAccessKey}`);
  signingKey = await hmacSha256(signingKey, dateStamp);
  signingKey = await hmacSha256(signingKey, region);
  signingKey = await hmacSha256(signingKey, service);
  signingKey = await hmacSha256(signingKey, 'aws4_request');
  const signature = await hmacHex(signingKey, stringToSign);

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
