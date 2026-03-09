/**
 * GET /api/v1/grants/search
 * Implements grant search directly in Next.js using OpenAI or Anthropic web search.
 */
import { NextRequest, NextResponse } from 'next/server';
import { storeGrants } from '@/lib/grant-cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const EXTRACTION_PROMPT = `You are a federal grant discovery assistant. Use your web search capability to find REAL, currently open federal grant opportunities matching the query.

For each grant found, extract a JSON object with EXACTLY these fields (all strings):
- id: stable identifier derived from opportunity_number or a slug from title+agency
- title: official grant title
- agency: full federal agency name
- description: 2-3 sentence description of the grant purpose
- eligibility: who can apply
- award_amount: funding range or "Varies" if unknown
- deadline: application deadline in YYYY-MM-DD format, or empty string if unknown
- category: one of [Education, Health, Environment, Science, Arts, Community Development, Agriculture, Technology]
- url: real URL from search results pointing to the grant; never make up URLs
- opportunity_number: official opportunity/CFDA number if found, otherwise empty string

Return ONLY a valid JSON array — no markdown, no explanation.
Search query: {query}
Find up to {limit} real, currently open federal grant opportunities.`;

function parseGrantsJson(content: string): any[] {
  if (!content) return [];
  let s = content.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```\s*$/, '');
  try {
    const start = s.indexOf('[');
    const end = s.lastIndexOf(']') + 1;
    if (start >= 0 && end > start) {
      const arr = JSON.parse(s.slice(start, end));
      if (Array.isArray(arr)) return arr.filter((g: any) => g && typeof g === 'object');
    }
    const data = JSON.parse(s);
    if (Array.isArray(data)) return data.filter((g: any) => g && typeof g === 'object');
    if (data?.grants) return data.grants;
  } catch { /* ignored */ }
  return [];
}

function normalizeGrant(g: any): any {
  const slug = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  return {
    id: g.id || g.opportunity_number || slug(`${g.title || ''}-${g.agency || ''}`),
    title: g.title || 'Untitled Grant',
    agency: g.agency || 'Federal Agency',
    description: g.description || '',
    eligibility: g.eligibility || '',
    award_amount: g.award_amount || 'Varies',
    deadline: g.deadline || '',
    category: g.category || 'Technology',
    url: g.url || '',
    opportunity_number: g.opportunity_number || '',
  };
}

async function searchWithOpenAI(query: string, limit: number, apiKey: string): Promise<any[]> {
  const prompt = EXTRACTION_PROMPT.replace('{query}', query).replace('{limit}', String(limit));
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'gpt-4o-search-preview', messages: [{ role: 'user', content: prompt }], max_tokens: 4000 }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return parseGrantsJson(data.choices?.[0]?.message?.content || '');
}

async function searchWithAnthropic(query: string, limit: number, apiKey: string): Promise<any[]> {
  const prompt = EXTRACTION_PROMPT.replace('{query}', query).replace('{limit}', String(limit));
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-3-5-haiku-latest', max_tokens: 4000, messages: [{ role: 'user', content: prompt }], tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }] }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  let text = '';
  for (const block of data.content || []) { if (block.type === 'text') text += block.text; }
  return parseGrantsJson(text);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q') || 'federal grants USA';
  const category = searchParams.get('category');
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const provider = (process.env.LLM_PROVIDER || 'openai').toLowerCase();

  if (!openaiKey && !anthropicKey) {
    return NextResponse.json({ detail: 'Grant discovery is not configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.' }, { status: 503 });
  }

  const searchQuery = category ? `${q} ${category} federal grant` : `${q} federal grant`;
  const start = Date.now();
  let grants: any[] = [];
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
      return NextResponse.json({ detail: `Grant search failed: ${err2 instanceof Error ? err2.message : String(err2)}` }, { status: 500 });
    }
  }

  const normalized = grants.map(normalizeGrant).slice(0, limit);
  storeGrants(normalized);

  return NextResponse.json({
    grants: normalized,
    provider: usedProvider,
    providers_used: [usedProvider],
    query: searchQuery,
    count: normalized.length,
    response_time_ms: Date.now() - start,
  });
}
