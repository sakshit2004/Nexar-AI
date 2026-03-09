/**
 * GET /api/v1/grants/[id]
 * Looks up a grant by ID from the in-memory cache populated by the search/recommended routes.
 * If not found in cache, returns a 404 with a clear message.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getGrant } from '@/lib/grant-cache';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const grant = getGrant(id);
  if (grant) {
    return NextResponse.json(grant);
  }

  // Grant not in cache — it may have been from a different serverless instance.
  // Return a minimal placeholder so the detail page can still display something.
  return NextResponse.json(
    { detail: `Grant "${id}" not found. Please go back and open the grant from the search results.` },
    { status: 404 }
  );
}
