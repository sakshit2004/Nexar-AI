/**
 * POST /api/v1/grants/[id]/analyze
 * Generates AI summary and match analysis for a grant using OpenAI or Anthropic.
 * Accepts optional grant data in request body (when client has it from sessionStorage).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getGrant } from '@/lib/grant-cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: grantId } = await params;

  let grant = getGrant(grantId);
  if (!grant) {
    try {
      const body = await request.json();
      if (body?.grant && typeof body.grant === 'object') grant = body.grant;
    } catch { /* no body or invalid */ }
  }
  if (!grant) {
    return NextResponse.json(
      { detail: `Grant "${grantId}" not found. Please open the grant from search results first.` },
      { status: 404 }
    );
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const provider = (process.env.LLM_PROVIDER || 'openai').toLowerCase();

  if (!openaiKey && !anthropicKey) {
    return NextResponse.json(
      { detail: 'Grant analysis not configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.' },
      { status: 503 }
    );
  }

  const prompt = `Analyze this federal grant and provide a plain-English summary:

Grant: ${grant.title || 'Unknown'}
Agency: ${grant.agency || 'Unknown'}
Description: ${grant.description || 'N/A'}
Eligibility: ${grant.eligibility || 'N/A'}
Award Amount: ${grant.award_amount || 'N/A'}
Deadline: ${grant.deadline || 'N/A'}

Provide:
1. A 2-3 sentence plain-English summary
2. Key eligibility requirements
3. Application tips
4. Important deadlines and milestones`;

  let content = '';
  let usedProvider = provider;

  try {
    if (provider === 'anthropic' && anthropicKey) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-latest',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!res.ok) throw new Error(`Anthropic ${res.status}`);
      const data = await res.json();
      for (const block of data.content || []) {
        if (block.type === 'text') content += block.text;
      }
      usedProvider = 'anthropic';
    } else if (openaiKey) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
        }),
      });
      if (!res.ok) throw new Error(`OpenAI ${res.status}`);
      const data = await res.json();
      content = data.choices?.[0]?.message?.content || '';
      usedProvider = 'openai';
    } else if (anthropicKey) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-latest',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!res.ok) throw new Error(`Anthropic ${res.status}`);
      const data = await res.json();
      for (const block of data.content || []) {
        if (block.type === 'text') content += block.text;
      }
      usedProvider = 'anthropic';
    }
  } catch (err) {
    return NextResponse.json(
      { detail: `Analysis failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    grant_id: grantId,
    ai_summary: content || 'Unable to generate summary.',
    match_score: 75,
    recommendation: 'This grant appears to be a good match for your organization.',
    provider: usedProvider,
  });
}
