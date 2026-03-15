/**
 * POST /api/v1/saved/favorite — Toggle favorite status for a saved grant.
 *
 * Body: { grantId: string }
 * Grant must already be in saved:{email}. Adds/removes from favorites:{email}.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { kv } from '@/lib/kv';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return unauthorized();

  const email = session.user.email;

  let grantId: string;
  try {
    const body = await request.json();
    grantId = String(body?.grantId ?? '').trim();
    if (!grantId) return NextResponse.json({ detail: 'grantId is required' }, { status: 400 });
  } catch {
    return NextResponse.json({ detail: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const isSaved = await kv.sismember(`saved:${email}`, grantId);
    if (!isSaved) {
      return NextResponse.json({ detail: 'Grant must be saved before favoriting' }, { status: 400 });
    }

    const isFavorite = await kv.sismember(`favorites:${email}`, grantId);
    if (isFavorite) {
      await kv.srem(`favorites:${email}`, grantId);
      return NextResponse.json({ ok: true, grantId, is_favorite: false });
    } else {
      await kv.sadd(`favorites:${email}`, grantId);
      return NextResponse.json({ ok: true, grantId, is_favorite: true });
    }
  } catch {
    return NextResponse.json({ detail: 'Failed to toggle favorite' }, { status: 500 });
  }
}
