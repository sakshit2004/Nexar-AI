/**
 * GET /api/v1/grants/search
 * Implements grant search directly in Next.js using OpenAI or Anthropic web search.
 */
import { NextRequest, NextResponse } from 'next/server';
import { storeGrants, hasFutureDeadline, type Grant } from '@/lib/grant-cache';
import { searchWithOpenAI, searchWithAnthropic } from '@/lib/grant-utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q') || 'federal grants USA';
  const category = searchParams.get('category');
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const provider = (process.env.LLM_PROVIDER || 'openai').toLowerCase();

  if (!openaiKey && !anthropicKey) {
    return NextResponse.json(
      { detail: 'Grant discovery is not configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.' },
      { status: 503 },
    );
  }

  const searchQuery = category ? `${q} ${category} federal grant` : `${q} federal grant`;
  const start = Date.now();
  let grants: Grant[] = [];
  let usedProvider = provider;

  try {
    if (provider === 'anthropic' && anthropicKey) {
      grants = await searchWithAnthropic(searchQuery, limit, anthropicKey);
      usedProvider = 'anthropic';
    } else if (openaiKey) {
      grants = await searchWithOpenAI(searchQuery, limit, openaiKey);
      usedProvider = 'openai';
    } else if (anthropicKey) {
      grants = await searchWithAnthropic(searchQuery, limit, anthropicKey);
      usedProvider = 'anthropic';
    }
  } catch (err) {
    try {
      if (usedProvider === 'openai' && anthropicKey) {
        grants = await searchWithAnthropic(searchQuery, limit, anthropicKey);
        usedProvider = 'anthropic (fallback)';
      } else if (openaiKey) {
        grants = await searchWithOpenAI(searchQuery, limit, openaiKey);
        usedProvider = 'openai (fallback)';
      } else throw err;
    } catch (err2) {
      return NextResponse.json(
        { detail: `Grant search failed: ${err2 instanceof Error ? err2.message : String(err2)}` },
        { status: 500 },
      );
    }
  }

  const normalized = grants.filter(hasFutureDeadline).slice(0, limit);
  await storeGrants(normalized);

  return NextResponse.json({
    grants: normalized,
    provider: usedProvider,
    providers_used: [usedProvider],
    query: searchQuery,
    count: normalized.length,
    response_time_ms: Date.now() - start,
  });
}
