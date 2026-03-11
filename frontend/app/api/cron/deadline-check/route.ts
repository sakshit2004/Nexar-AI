/**
 * GET /api/cron/deadline-check
 * Runs daily at 9 AM UTC via Vercel Cron (configured in vercel.json).
 *
 * Checks saved grants for each user and sends deadline alert emails
 * when a grant is due in exactly 7 or 1 days.
 *
 * Protected by CRON_SECRET — Vercel automatically sends
 * Authorization: Bearer <CRON_SECRET> for cron jobs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/kv';
import { getGrant } from '@/lib/grant-cache';
import { sendDeadlineAlert } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const deadline = new Date(dateStr);
  if (isNaN(deadline.getTime())) return null;
  const now = new Date();
  const diffMs = deadline.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  let processed = 0;
  let emailsSent = 0;

  try {
    const users = (await kv.smembers('all-users')) as string[];

    for (const email of users) {
      const grantIds = (await kv.smembers(`saved:${email}`)) as string[];

      for (const grantId of grantIds) {
        const grant = await getGrant(grantId);
        if (!grant?.deadline) continue;

        const daysLeft = daysUntil(grant.deadline);
        if (daysLeft === 7 || daysLeft === 1) {
          if (process.env.RESEND_API_KEY) {
            try {
              await sendDeadlineAlert(email, grant, daysLeft);
              emailsSent++;
            } catch {
              // Don't fail the whole run if one email fails
            }
          }
          // If RESEND_API_KEY not set, skip sending — cron still runs successfully
        }
      }
      processed++;
    }
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, processed, emailsSent });
}
