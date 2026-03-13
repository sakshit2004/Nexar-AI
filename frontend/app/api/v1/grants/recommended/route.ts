/**
 * GET /api/v1/grants/recommended
 * Implements grant discovery directly in Next.js using OpenAI or Anthropic web search.
 * Runs on Vercel as a Node.js serverless function — no Python backend needed.
 */
import { NextRequest, NextResponse } from 'next/server';
import { storeGrants, hasFutureDeadline, type Grant } from '@/lib/grant-cache';
import { searchWithOpenAI, searchWithAnthropic } from '@/lib/grant-utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const VARIETY_PHRASES = [
  'museums libraries archives',
  'STEM science education research',
  'arts culture humanities',
  'community development youth',
  'technology innovation open source',
  'student programs workforce',
];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q') || 'federal grants USA';
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);
  const seed = parseInt(searchParams.get('seed') || '0', 10);

  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const provider = (process.env.LLM_PROVIDER || 'openai').toLowerCase();

  if (!openaiKey && !anthropicKey) {
    return NextResponse.json(
      { detail: 'Grant discovery is not configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in Vercel → Settings → Environment Variables.' },
      { status: 503 },
    );
  }

  let searchQuery = q;
  const words = q.trim().split(/\s+/);
  if (words.length <= 2 && q.toLowerCase() !== 'federal grants usa') {
    searchQuery = `open federal grants for ${q} USA`;
  } else {
    searchQuery = `${q} federal grant`;
  }
  if (seed > 0) {
    searchQuery += ` ${VARIETY_PHRASES[seed % VARIETY_PHRASES.length]}`;
  }

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
  } catch (primaryErr) {
    try {
      if (usedProvider === 'openai' && anthropicKey) {
        grants = await searchWithAnthropic(searchQuery, limit, anthropicKey);
        usedProvider = 'anthropic (fallback)';
      } else if (openaiKey) {
        grants = await searchWithOpenAI(searchQuery, limit, openaiKey);
        usedProvider = 'openai (fallback)';
      } else {
        throw primaryErr;
      }
    } catch (fallbackErr) {
      const msg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      return NextResponse.json({ detail: `Grant search failed: ${msg}` }, { status: 500 });
    }
  }

  const normalized = grants.filter(hasFutureDeadline).slice(0, limit);
  await storeGrants(normalized);
  const isPersonalized = q !== 'federal grants USA' && q !== 'federal grants usa';

  return NextResponse.json({
    grants: normalized,
    provider: usedProvider,
    providers_used: [usedProvider],
    query: searchQuery,
    count: normalized.length,
    personalized: isPersonalized,
    response_time_ms: Date.now() - start,
  });
}
