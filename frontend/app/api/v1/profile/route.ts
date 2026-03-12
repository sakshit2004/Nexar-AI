/**
 * /api/v1/profile — KV-backed organization profile for the authenticated user.
 *
 * GET → fetch profile
 * PUT → upsert profile fields
 *
 * KV key: profile:{email}  → Redis hash
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { kv } from '@/lib/kv';

export const dynamic = 'force-dynamic';

export interface StoredProfile {
  full_name: string;
  organization_name: string;
  organization_type: string;
  focus_areas: string;   // JSON array stored as string
  keywords: string;      // JSON array stored as string
  location_state: string;
  location_county: string;
  grant_amount_min: string;
  grant_amount_max: string;
}

function parseProfile(raw: Record<string, string> | null) {
  if (!raw) return null;
  return {
    full_name: raw.full_name ?? '',
    organization_name: raw.organization_name ?? '',
    organization_type: raw.organization_type ?? '',
    focus_areas: safeParseArray(raw.focus_areas),
    keywords: safeParseArray(raw.keywords),
    location_state: raw.location_state ?? '',
    location_county: raw.location_county ?? '',
    grant_amount_min: raw.grant_amount_min ? Number(raw.grant_amount_min) : null,
    grant_amount_max: raw.grant_amount_max ? Number(raw.grant_amount_max) : null,
    onboarding_completed: raw.onboarding_completed === 'true',
    onboarding_step: raw.onboarding_step ? Number(raw.onboarding_step) : 0,
  };
}

function safeParseArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value); } catch { return []; }
}

function unauthorized() {
  return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return unauthorized();

  const email = session.user.email;

  try {
    const raw = await kv.hgetall<Record<string, string>>(`profile:${email}`);
    return NextResponse.json({ profile: parseProfile(raw) });
  } catch {
    return NextResponse.json({ profile: null });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return unauthorized();

  const email = session.user.email;

  let body: Partial<{
    full_name: string;
    organization_name: string;
    organization_type: string;
    focus_areas: string[] | string;
    keywords: string[] | string;
    location_state: string;
    location_county: string;
    grant_amount_min: number | null;
    grant_amount_max: number | null;
    onboarding_completed: boolean;
    onboarding_step: number;
  }>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid JSON body' }, { status: 400 });
  }

  const toStore: Record<string, string> = {};
  if (body.full_name !== undefined) toStore.full_name = body.full_name;
  if (body.organization_name !== undefined) toStore.organization_name = body.organization_name;
  if (body.organization_type !== undefined) toStore.organization_type = body.organization_type;
  if (body.location_state !== undefined) toStore.location_state = body.location_state;
  if (body.location_county !== undefined) toStore.location_county = body.location_county;
  if (body.grant_amount_min !== undefined) toStore.grant_amount_min = body.grant_amount_min != null ? String(body.grant_amount_min) : '';
  if (body.grant_amount_max !== undefined) toStore.grant_amount_max = body.grant_amount_max != null ? String(body.grant_amount_max) : '';
  if (body.onboarding_completed !== undefined) toStore.onboarding_completed = body.onboarding_completed ? 'true' : 'false';
  if (body.onboarding_step !== undefined) toStore.onboarding_step = String(body.onboarding_step);
  if (body.focus_areas !== undefined) {
    toStore.focus_areas = Array.isArray(body.focus_areas) ? JSON.stringify(body.focus_areas) : body.focus_areas;
  }
  if (body.keywords !== undefined) {
    toStore.keywords = Array.isArray(body.keywords) ? JSON.stringify(body.keywords) : body.keywords;
  }

  if (Object.keys(toStore).length === 0) {
    return NextResponse.json({ detail: 'No fields to update' }, { status: 400 });
  }

  try {
    await kv.hset(`profile:${email}`, toStore);
    const raw = await kv.hgetall<Record<string, string>>(`profile:${email}`);
    return NextResponse.json({ profile: parseProfile(raw) });
  } catch {
    return NextResponse.json({ detail: 'Failed to save profile' }, { status: 500 });
  }
}
