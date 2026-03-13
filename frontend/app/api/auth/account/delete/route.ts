/**
 * POST /api/auth/account/delete
 * Deletes the user account and all associated data.
 * Requires email confirmation in body matching the authenticated user.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { kv } from '@/lib/kv';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return unauthorized();

  const sessionEmail = session.user.email.toLowerCase().trim();

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const providedEmail = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : '';
  if (!providedEmail) {
    return NextResponse.json({ error: 'Please enter your email to confirm account deletion.' }, { status: 400 });
  }

  if (providedEmail !== sessionEmail) {
    return NextResponse.json({ error: 'Email does not match your account. Please enter your full email address.' }, { status: 400 });
  }

  try {
    await kv.del(`user:${sessionEmail}`);
    await kv.del(`profile:${sessionEmail}`);
    await kv.del(`saved:${sessionEmail}`);
    await kv.srem('all-users', sessionEmail);
  } catch (err) {
    console.error('Account deletion error:', err);
    return NextResponse.json({ error: 'Failed to delete account. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
