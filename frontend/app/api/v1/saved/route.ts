/**
 * /api/v1/saved — KV-backed saved grants for the authenticated user.
 *
 * GET    → list saved grants
 * POST   → save a grant  { grantId: string }
 * DELETE → unsave a grant { grantId: string }
 *
 * KV keys:
 *   saved:{email}   → Redis set of grant IDs
 *   grant:{id}      → grant JSON (stored by search/recommended routes)
 *   all-users       → Redis set of all user emails (for cron)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { kv } from '@/lib/kv';
import { getGrant } from '@/lib/grant-cache';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return unauthorized();

  const email = session.user.email;

  try {
    const grantIds = await kv.smembers(`saved:${email}`) as string[];
    if (!grantIds.length) {
      return NextResponse.json({ saved_grants: [], total: 0, favorites: 0, by_category: {}, by_status: {} });
    }

    const grants = await Promise.all(
      grantIds.map(async (id: string) => {
        const g = await getGrant(id);
        return g ?? null;
      }),
    );

    const validGrants = grants.filter(Boolean);
    return NextResponse.json({
      saved_grants: validGrants,
      total: validGrants.length,
      total_saved: validGrants.length,
      favorites: 0,
      by_category: {},
      by_status: {},
    });
  } catch {
    return NextResponse.json({ saved_grants: [], total: 0, total_saved: 0, favorites: 0, by_category: {}, by_status: {} });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return unauthorized();

  const email = session.user.email;

  let grantId: string;
  try {
    const body = await request.json();
    grantId = body?.grantId;
    if (!grantId) return NextResponse.json({ detail: 'grantId is required' }, { status: 400 });
  } catch {
    return NextResponse.json({ detail: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    await kv.sadd(`saved:${email}`, grantId);
    // Track user in all-users set for cron deadline checker
    await kv.sadd('all-users', email);
    return NextResponse.json({ ok: true, grantId });
  } catch {
    return NextResponse.json({ detail: 'Failed to save grant' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return unauthorized();

  const email = session.user.email;

  let grantId: string;
  try {
    const body = await request.json();
    grantId = body?.grantId;
    if (!grantId) return NextResponse.json({ detail: 'grantId is required' }, { status: 400 });
  } catch {
    return NextResponse.json({ detail: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    await kv.srem(`saved:${email}`, grantId);
    return NextResponse.json({ ok: true, grantId });
  } catch {
    return NextResponse.json({ detail: 'Failed to unsave grant' }, { status: 500 });
  }
}
