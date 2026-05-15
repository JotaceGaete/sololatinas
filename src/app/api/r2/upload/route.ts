import { NextResponse } from 'next/server';

export const runtime = 'edge';

const textEncoder = new TextEncoder();

function toBytes(value: string | Uint8Array) {
  return typeof value === 'string' ? textEncoder.encode(value) : value;
}

function toHex(buffer: ArrayBuffer | Uint8Array) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(value: string | Uint8Array) {
  return toHex(await crypto.subtle.digest('SHA-256', toBytes(value)));
}

async function hmac(key: string | Uint8Array, value: string) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    toBytes(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, textEncoder.encode(value)));
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
  if (file.type === 'video/mp4') return 'mp4';
  if (file.type === 'video/webm') return 'webm';
  if (file.type === 'video/quicktime') return 'mov';
  return 'jpg';
}

const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const MAX_VIDEO_SIZE_BYTES = 250 * 1024 * 1024;

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
  const folder = String(formData.get('folder') ?? 'covers').replace(/[^a-zA-Z0-9_-]/g, '') || 'covers';

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  const isImage = file.type.startsWith('image/');
  const isAllowedVideo = ALLOWED_VIDEO_TYPES.has(file.type);

  if (!isImage && !isAllowedVideo) {
    return NextResponse.json({ error: 'Only images and supported videos are allowed' }, { status: 400 });
  }

  if (isAllowedVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
    return NextResponse.json({ error: 'Video file is too large' }, { status: 400 });
  }

  const body = new Uint8Array(await file.arrayBuffer());
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';
  const key = `${folder}/${userId || 'anonymous'}/${Date.now()}.${extensionFrom(file)}`;
  const url = new URL(`${endpoint}/${bucket}/${encodePath(key)}`);
  const payloadHash = await sha256Hex(body);
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
    await sha256Hex(canonicalRequest),
  ].join('\n');

  const dateKey = await hmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = await hmac(dateKey, region);
  const serviceKey = await hmac(regionKey, service);
  const signingKey = await hmac(serviceKey, 'aws4_request');
  const signature = toHex(await hmac(signingKey, stringToSign));
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
