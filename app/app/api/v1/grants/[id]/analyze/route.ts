/**
 * POST /api/v1/grants/[id]/analyze
 * 1. Generates an AI plain-English summary of the grant.
 * 2. Performs LLM-powered eligibility scoring against the user's profile.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGrant } from '@/lib/grant-cache';
import { kv } from '@/lib/kv';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface EligibilityResult {
  status: 'eligible' | 'likely_eligible' | 'check_required' | 'ineligible';
  confidence: number;
  reasons: string[];
  missing_info: string[];
}

async function callOpenAI(prompt: string, apiKey: string, jsonMode = false): Promise<string> {
  const body: Record<string, unknown> = {
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1200,
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function callAnthropic(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-3-5-haiku-latest', max_tokens: 1200, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = await res.json();
  let text = '';
  for (const block of data.content ?? []) { if (block.type === 'text') text += block.text; }
  return text;
}

async function llm(prompt: string, openaiKey: string | undefined, anthropicKey: string | undefined, provider: string, jsonMode = false): Promise<string> {
  if (provider === 'anthropic' && anthropicKey) return callAnthropic(prompt, anthropicKey);
  if (openaiKey) return callOpenAI(prompt, openaiKey, jsonMode);
  if (anthropicKey) return callAnthropic(prompt, anthropicKey);
  throw new Error('No LLM provider configured');
}

function safeParseArray(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return value ? [value] : []; }
  }
  return [];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: grantId } = await params;

  // Auth check
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  let grant = await getGrant(grantId);
  if (!grant) {
    try {
      const body = await request.json();
      if (body?.grant && typeof body.grant === 'object') grant = body.grant;
    } catch { /* no body */ }
  }
  if (!grant) {
    return NextResponse.json(
      { detail: `Grant "${grantId}" not found. Please open the grant from search results first.` },
      { status: 404 },
    );
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const provider = (process.env.LLM_PROVIDER ?? 'openai').toLowerCase();

  if (!openaiKey && !anthropicKey) {
    return NextResponse.json({ detail: 'Grant analysis not configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.' }, { status: 503 });
  }

  // --- Call 1: Plain-English summary ---
  const summaryPrompt = `Analyze this grant and provide a plain-English summary:

Grant: ${grant.title ?? 'Unknown'}
Agency: ${grant.agency ?? 'Unknown'}
Description: ${grant.description ?? 'N/A'}
Eligibility: ${grant.eligibility ?? 'N/A'}
Award Amount: ${grant.award_amount ?? 'N/A'}
Deadline: ${grant.deadline ?? 'N/A'}

Provide:
1. A 2-3 sentence plain-English summary
2. Key eligibility requirements
3. Application tips
4. Important deadlines and milestones`;

  let aiSummary = '';
  let usedProvider = provider;

  try {
    aiSummary = await llm(summaryPrompt, openaiKey, anthropicKey, provider);
    usedProvider = provider === 'anthropic' && anthropicKey ? 'anthropic' : openaiKey ? 'openai' : 'anthropic';
  } catch (err) {
    return NextResponse.json(
      { detail: `Analysis failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }

  // --- Call 2: Eligibility scoring against user profile ---
  let eligibility: EligibilityResult | null = null;

  try {
    let profileRaw: Record<string, string> | null = null;
    try {
      profileRaw = await kv.hgetall<Record<string, string>>(`profile:${session.user.email}`);
    } catch { /* KV not configured */ }

    if (profileRaw) {
      const profile = {
        organization_name: profileRaw.organization_name ?? '',
        organization_type: profileRaw.organization_type ?? '',
        focus_areas: safeParseArray(profileRaw.focus_areas).join(', '),
        location_state: profileRaw.location_state ?? '',
        grant_amount_min: profileRaw.grant_amount_min ?? '',
        grant_amount_max: profileRaw.grant_amount_max ?? '',
      };

      const eligibilityPrompt = `You are a grant eligibility expert. Given the grant eligibility requirements and the applicant's profile, determine eligibility.

GRANT ELIGIBILITY:
${grant.eligibility ?? 'Not specified'}

GRANT DESCRIPTION:
${grant.description ?? 'Not specified'}

APPLICANT PROFILE:
- Organization: ${profile.organization_name || 'Not specified'}
- Type: ${profile.organization_type || 'Not specified'}
- Focus Areas: ${profile.focus_areas || 'Not specified'}
- Location: ${profile.location_state || 'Not specified'}
- Budget Range: ${profile.grant_amount_min ? `$${profile.grant_amount_min} - $${profile.grant_amount_max}` : 'Not specified'}

Respond with ONLY valid JSON (no markdown):
{
  "status": "eligible" | "likely_eligible" | "check_required" | "ineligible",
  "confidence": <integer 0-100>,
  "reasons": [<2-4 specific reason strings>],
  "missing_info": [<0-3 strings describing info needed to confirm eligibility>]
}`;

      const rawJson = await llm(eligibilityPrompt, openaiKey, anthropicKey, provider, true);

      // Extract JSON from the response
      const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as EligibilityResult;
        const validStatuses = ['eligible', 'likely_eligible', 'check_required', 'ineligible'];
        if (validStatuses.includes(parsed.status)) {
          eligibility = {
            status: parsed.status,
            confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 50)),
            reasons: Array.isArray(parsed.reasons) ? parsed.reasons.slice(0, 4) : [],
            missing_info: Array.isArray(parsed.missing_info) ? parsed.missing_info.slice(0, 3) : [],
          };
        }
      }
    }
  } catch {
    // Eligibility scoring is best-effort — don't fail the whole request
  }

  return NextResponse.json({
    grant_id: grantId,
    ai_summary: aiSummary || 'Unable to generate summary.',
    match_score: eligibility ? eligibility.confidence : 75,
    recommendation: 'This grant appears to be a good match for your organization.',
    provider: usedProvider,
    eligibility,
  });
}
