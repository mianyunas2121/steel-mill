import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function backendBase() {
  const raw = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
  if (!raw) return null;
  // Localhost backend is unreachable from Vercel's servers / other phones
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(raw)) return null;
  return raw;
}

async function proxy(request, context) {
  const base = backendBase();
  if (!base) {
    return NextResponse.json(
      {
        success: false,
        message:
          'API_URL is not set on Vercel (or still points to localhost). Set API_URL to your Railway public URL, e.g. https://xxxx.up.railway.app, then redeploy.',
      },
      { status: 503 }
    );
  }

  const pathParts = context.params?.path;
  const path = Array.isArray(pathParts) ? pathParts.join('/') : pathParts || '';
  const incoming = new URL(request.url);
  const target = `${base}/api/${path}${incoming.search}`;

  const headers = new Headers();
  const auth = request.headers.get('authorization');
  const contentType = request.headers.get('content-type');
  if (auth) headers.set('authorization', auth);
  if (contentType) headers.set('content-type', contentType);
  headers.set('accept', 'application/json');

  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  try {
    const upstream = await fetch(target, init);
    const outHeaders = new Headers();
    const upstreamType = upstream.headers.get('content-type');
    if (upstreamType) outHeaders.set('content-type', upstreamType);

    const buf = await upstream.arrayBuffer();
    return new NextResponse(buf, {
      status: upstream.status,
      headers: outHeaders,
    });
  } catch (err) {
    console.error('API proxy error:', err);
    return NextResponse.json(
      {
        success: false,
        message: `Cannot reach Railway backend at ${base}. Check the service is online and API_URL is correct.`,
      },
      { status: 502 }
    );
  }
}

export async function GET(request, context) {
  return proxy(request, context);
}
export async function POST(request, context) {
  return proxy(request, context);
}
export async function PUT(request, context) {
  return proxy(request, context);
}
export async function PATCH(request, context) {
  return proxy(request, context);
}
export async function DELETE(request, context) {
  return proxy(request, context);
}
