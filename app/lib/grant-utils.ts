/**
 * Shared grant search utilities used by both /api/v1/grants/search and
 * /api/v1/grants/recommended. Extracted from the two route files to eliminate duplication.
 */
import type { Grant } from '@/lib/grant-cache';

export const EXTRACTION_PROMPT = `You are a federal grant discovery assistant. Use your web search capability to find REAL, currently open federal grant opportunities matching the query.

For each grant found, extract a JSON object with EXACTLY these fields (all strings):
- id: stable identifier derived from opportunity_number or a slug from title+agency
- title: official grant title
- agency: full federal agency name (e.g. "National Science Foundation", "U.S. Department of Education")
- description: 2-3 sentence description of the grant purpose
- eligibility: who can apply (e.g. "Nonprofit organizations, universities, state/local governments")
- award_amount: funding range (e.g. "$50,000 - $500,000") or "Varies" if unknown
- deadline: application deadline in YYYY-MM-DD format, or empty string if unknown
- category: one of [Education, Health, Environment, Science, Arts, Community Development, Agriculture, Technology]
- url: real URL from search results pointing to the grant (grants.gov or agency site); never make up URLs
- opportunity_number: official opportunity/CFDA number if found, otherwise empty string

Return ONLY a valid JSON array of such objects — no markdown, no explanation, no wrapper object.
If fewer than {limit} real federal grants can be found, return what you found (never invent grants).
Search query: {query}
Find up to {limit} real, currently open federal grant opportunities.`;

export function parseGrantsJson(content: string): Record<string, unknown>[] {
  if (!content) return [];
  let s = content.trim();
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*/, '').replace(/\s*```\s*$/, '');
  }
  try {
    const start = s.indexOf('[');
    const end = s.lastIndexOf(']') + 1;
    if (start >= 0 && end > start) {
      const arr = JSON.parse(s.slice(start, end));
      if (Array.isArray(arr)) return arr.filter((g) => g && typeof g === 'object');
    }
    const data = JSON.parse(s);
    if (Array.isArray(data)) return data.filter((g) => g && typeof g === 'object');
    if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>).grants)) {
      return (data as { grants: Record<string, unknown>[] }).grants;
    }
  } catch {
    // fall through
  }
  return [];
}

export function normalizeGrant(g: Record<string, unknown>): Grant {
  const slug = (s: string) =>
    (s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  return {
    id: str(g.id) || str(g.opportunity_number) || slug(`${str(g.title)}-${str(g.agency)}`),
    title: str(g.title) || 'Untitled Grant',
    agency: str(g.agency) || 'Federal Agency',
    description: str(g.description),
    eligibility: str(g.eligibility),
    award_amount: str(g.award_amount) || 'Varies',
    deadline: str(g.deadline),
    category: str(g.category) || 'Technology',
    url: str(g.url),
    opportunity_number: str(g.opportunity_number),
  };
}

export async function searchWithOpenAI(
  query: string,
  limit: number,
  apiKey: string,
): Promise<Grant[]> {
  const prompt = EXTRACTION_PROMPT.replace('{query}', query).replace('{limit}', String(limit));
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-search-preview',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  return parseGrantsJson(data.choices?.[0]?.message?.content || '').map(normalizeGrant);
}

export async function searchWithAnthropic(
  query: string,
  limit: number,
  apiKey: string,
): Promise<Grant[]> {
  const prompt = EXTRACTION_PROMPT.replace('{query}', query).replace('{limit}', String(limit));
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json() as { content?: { type: string; text?: string }[] };
  let text = '';
  for (const block of data.content || []) {
    if (block.type === 'text') text += block.text ?? '';
  }
  return parseGrantsJson(text).map(normalizeGrant);
}
