/**
 * GET /api/v1/grants/[id]
 * Looks up a grant by ID from the Redis cache populated by the search/recommended routes.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getGrant } from '@/lib/grant-cache';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const grant = await getGrant(id);
  if (grant) {
    return NextResponse.json(grant);
  }

  return NextResponse.json(
    { detail: `Grant "${id}" not found. Please go back and open the grant from the search results.` },
    { status: 404 },
  );
}
