/**
 * Proxy /api/v1/* to the Python backend (api/index on Vercel).
 * Next.js receives the request first; we forward it so the Python function actually runs.
 */
import { NextRequest, NextResponse } from 'next/server';

function getBackendUrl(req: NextRequest): string {
  // On Vercel: Python is at /api/index; we send X-Original-URL so it can route.
  // Local: backend runs at localhost:8000 with routes at /api/v1/...
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/index`;
  }
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return `${base}${req.nextUrl.pathname}${req.nextUrl.search}`;
}

export async function GET(request: NextRequest) {
  return proxy(request);
}

export async function POST(request: NextRequest) {
  return proxy(request);
}

export async function PUT(request: NextRequest) {
  return proxy(request);
}

export async function PATCH(request: NextRequest) {
  return proxy(request);
}

export async function DELETE(request: NextRequest) {
  return proxy(request);
}

async function proxy(request: NextRequest) {
  const backendUrl = getBackendUrl(request);
  const headers = new Headers(request.headers);
  // On Vercel, Python is invoked at /api/index; send original URL so it can route
  if (process.env.VERCEL_URL) {
    headers.set('X-Original-URL', request.url);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
  };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      init.body = await request.text();
    } catch {
      // no body
    }
  }

  let res: Response;
  try {
    res = await fetch(backendUrl, init);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { detail: `Backend unreachable: ${message}. Check that the Python function is deployed and env vars (e.g. OPENAI_API_KEY) are set.` },
      { status: 503 }
    );
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await res.json().catch(() => ({})) : await res.text();

  // Always return JSON for errors so the client can show the message
  if (!res.ok) {
    const detail =
      typeof body === 'object' && body && typeof (body as { detail?: string }).detail === 'string'
        ? (body as { detail: string }).detail
        : typeof body === 'string'
          ? body.slice(0, 600)
          : 'Backend error';
    return NextResponse.json({ detail }, { status: res.status });
  }

  if (isJson) {
    return NextResponse.json(body, { status: res.status, statusText: res.statusText });
  }
  return new NextResponse(typeof body === 'string' ? body : JSON.stringify(body), {
    status: res.status,
    statusText: res.statusText,
    headers: { 'Content-Type': contentType || 'application/json' },
  });
}
