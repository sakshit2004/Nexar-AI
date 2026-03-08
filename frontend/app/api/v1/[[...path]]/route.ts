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
    duplex: 'half',
  };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      init.body = await request.text();
    } catch {
      // no body
    }
  }

  const res = await fetch(backendUrl, init);
  const contentType = res.headers.get('content-type') || 'application/json';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await res.json() : await res.text();

  if (isJson) {
    return NextResponse.json(body, { status: res.status, statusText: res.statusText });
  }
  return new NextResponse(typeof body === 'string' ? body : JSON.stringify(body), {
    status: res.status,
    statusText: res.statusText,
    headers: { 'Content-Type': contentType },
  });
}
