import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export async function GET() {
  const vars = {
    R2_ENDPOINT: !!process.env.R2_ENDPOINT,
    R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: !!process.env.R2_BUCKET,
    R2_PUBLIC_URL: !!process.env.R2_PUBLIC_URL,
  };
  const allSet = Object.values(vars).every(Boolean);
  return NextResponse.json({ ok: allSet, vars });
}

function getR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function POST(req: NextRequest) {
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!bucket || !publicUrl || !process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    console.error('RELATO_UPLOAD_IMAGE missing R2 env vars', {
      R2_BUCKET: !!bucket,
      R2_PUBLIC_URL: !!publicUrl,
      R2_ENDPOINT: !!process.env.R2_ENDPOINT,
      R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
    });
    return NextResponse.json({ error: 'Servidor no configurado para imágenes' }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'La imagen no puede superar 5MB' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch {
    return NextResponse.json({ error: 'Error al leer el archivo' }, { status: 500 });
  }

  const client = getR2Client();
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: fileName,
        Body: Buffer.from(arrayBuffer),
        ContentType: file.type,
        CacheControl: 'public, max-age=31536000',
      })
    );
  } catch (err: any) {
    console.error('RELATO_UPLOAD_IMAGE r2_put_failed', { fileName, error: err?.message });
    return NextResponse.json({ error: 'Error al subir imagen' }, { status: 500 });
  }

  const filePublicUrl = `${publicUrl.replace(/\/$/, '')}/${fileName}`;
  console.log('RELATO_UPLOAD_IMAGE', { fileName, publicUrl: filePublicUrl, error: null });

  return NextResponse.json({ url: filePublicUrl });
}
