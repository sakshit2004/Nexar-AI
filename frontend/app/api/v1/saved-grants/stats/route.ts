/**
 * GET /api/v1/saved-grants/stats
 * Returns placeholder stats. Saved grants are stored client-side (session/localStorage),
 * so we return empty stats — the frontend handles the actual display from local state.
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    total_saved: 0,
    by_category: {},
    by_status: { saved: 0, applied: 0, awarded: 0 },
  });
}
