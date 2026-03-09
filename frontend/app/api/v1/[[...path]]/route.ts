/**
 * Proxy /api/v1/* to the Python backend (api/index on Vercel).
 * Next.js receives the request first; we forward it so the Python function actually runs.
 */
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getBackendUrl(req: NextRequest): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/index`;
  }
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const path = req.nextUrl?.pathname ?? req.url?.split('?')[0] ?? '/api/v1';
  const search = req.nextUrl?.search ?? (req.url?.includes('?') ? '?' + req.url.split('?')[1] : '');
  return `${base}${path}${search}`;
}

function safeJson(detail: string, status: number) {
  return NextResponse.json({ detail }, { status });
}

export async function GET(request: NextRequest) {
  try {
    return await proxy(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return safeJson(`Proxy error: ${message}`, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    return await proxy(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return safeJson(`Proxy error: ${message}`, 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    return await proxy(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return safeJson(`Proxy error: ${message}`, 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    return await proxy(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return safeJson(`Proxy error: ${message}`, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    return await proxy(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return safeJson(`Proxy error: ${message}`, 500);
  }
}

async function proxy(request: NextRequest) {
  try {
    const backendUrl = getBackendUrl(request);
    const headers = new Headers(request.headers);
    if (process.env.VERCEL_URL) {
      const orig = request.url ?? `${request.nextUrl?.pathname ?? ''}${request.nextUrl?.search ?? ''}`;
      headers.set('X-Original-URL', orig);
    }

    const init: RequestInit = { method: request.method, headers };
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
      return safeJson(
        `Backend unreachable: ${message}. Check Python deployment and env (e.g. OPENAI_API_KEY).`,
        503
      );
    }

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    let body: unknown;
    try {
      body = isJson ? await res.json() : await res.text();
    } catch {
      body = 'Invalid response body';
    }

    if (!res.ok) {
      const detail =
        typeof body === 'object' && body !== null && typeof (body as { detail?: string }).detail === 'string'
          ? (body as { detail: string }).detail
          : typeof body === 'string'
            ? body.slice(0, 600)
            : 'Backend error';
      return safeJson(detail, res.status);
    }

    if (isJson) {
      return NextResponse.json(body, { status: res.status, statusText: res.statusText });
    }
    return new NextResponse(typeof body === 'string' ? body : JSON.stringify(body), {
      status: res.status,
      statusText: res.statusText,
      headers: { 'Content-Type': contentType || 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return safeJson(`Proxy error: ${message}`, 500);
  }
}
