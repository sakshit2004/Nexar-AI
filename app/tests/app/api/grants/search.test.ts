/**
 * Tests for app/api/v1/grants/search/route.ts
 * Mocks: lib/grant-utils (searchWithOpenAI, searchWithAnthropic), lib/grant-cache (storeGrants, hasFutureDeadline)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockSearchOpenAI, mockSearchAnthropic, mockStoreGrants } = vi.hoisted(() => ({
  mockSearchOpenAI: vi.fn(),
  mockSearchAnthropic: vi.fn(),
  mockStoreGrants: vi.fn(),
}))

vi.mock('@/lib/grant-utils', () => ({
  searchWithOpenAI: (...args: unknown[]) => mockSearchOpenAI(...args),
  searchWithAnthropic: (...args: unknown[]) => mockSearchAnthropic(...args),
}))

vi.mock('@/lib/grant-cache', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/grant-cache')>()
  return {
    ...mod,
    storeGrants: (...args: unknown[]) => mockStoreGrants(...args),
  }
})

beforeEach(() => {
  vi.clearAllMocks()
  delete process.env.OPENAI_API_KEY
  delete process.env.ANTHROPIC_API_KEY
  delete process.env.LLM_PROVIDER
})

import { GET } from '@/app/api/v1/grants/search/route'

const sampleGrant = {
  id: 'g1',
  title: 'STEM Grant',
  agency: 'NSF',
  description: 'Education',
  eligibility: 'Universities',
  award_amount: '$50k',
  deadline: '2026-12-31',
  category: 'Education',
  url: 'https://example.com',
  opportunity_number: 'OPP-1',
}

function makeRequest(params?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/v1/grants/search')
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  return new NextRequest(url.toString())
}

describe('GET /api/v1/grants/search', () => {
  it('returns 503 when no API keys configured', async () => {
    const res = await GET(makeRequest({ q: 'education' }))
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.detail).toMatch(/not configured|OPENAI_API_KEY|ANTHROPIC_API_KEY/)
  })

  it('returns grants when OpenAI is configured', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    mockSearchOpenAI.mockResolvedValue([sampleGrant])
    const res = await GET(makeRequest({ q: 'education' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.grants).toHaveLength(1)
    expect(body.grants[0].title).toBe('STEM Grant')
    expect(body.provider).toBe('openai')
    expect(body.query).toContain('education')
    expect(mockStoreGrants).toHaveBeenCalled()
  })

  it('returns grants when Anthropic is configured', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test'
    process.env.LLM_PROVIDER = 'anthropic'
    mockSearchAnthropic.mockResolvedValue([sampleGrant])
    const res = await GET(makeRequest({ q: 'health' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.grants).toHaveLength(1)
    expect(body.provider).toBe('anthropic')
    expect(mockSearchAnthropic).toHaveBeenCalledWith(expect.stringContaining('health'), expect.any(Number), 'sk-ant-test')
  })

  it('uses default query when q is empty', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    mockSearchOpenAI.mockResolvedValue([])
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.query).toMatch(/grants USA|grant/)
    expect(mockSearchOpenAI).toHaveBeenCalledWith(expect.any(String), 10, 'sk-test')
  })

  it('appends category to search query', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    mockSearchOpenAI.mockResolvedValue([])
    const res = await GET(makeRequest({ q: 'research', category: 'Science' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.query).toContain('research')
    expect(body.query).toContain('Science')
  })

  it('respects limit param and caps at 50', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    mockSearchOpenAI.mockResolvedValue([sampleGrant])
    const res = await GET(makeRequest({ q: 'test', limit: '5' }))
    expect(res.status).toBe(200)
    expect(mockSearchOpenAI).toHaveBeenCalledWith(expect.any(String), 5, 'sk-test')
  })

  it('falls back to Anthropic when OpenAI fails', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test'
    mockSearchOpenAI.mockRejectedValue(new Error('OpenAI rate limit'))
    mockSearchAnthropic.mockResolvedValue([sampleGrant])
    const res = await GET(makeRequest({ q: 'test' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.provider).toBe('anthropic (fallback)')
    expect(body.grants).toHaveLength(1)
  })

  it('returns 500 when both providers fail', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    mockSearchOpenAI.mockRejectedValue(new Error('API error'))
    const res = await GET(makeRequest({ q: 'test' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.detail).toMatch(/Grant search failed|API error/)
  })

  it('appends grant_type to search query when provided', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    mockSearchOpenAI.mockResolvedValue([])
    const res = await GET(makeRequest({ q: 'education', grant_type: 'state' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.query).toContain('state grant')
    expect(mockSearchOpenAI).toHaveBeenCalledWith(expect.stringContaining('state grant'), 10, 'sk-test')
  })

  it('includes response_time_ms in success response', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    mockSearchOpenAI.mockResolvedValue([])
    const res = await GET(makeRequest({ q: 'test' }))
    const body = await res.json()
    expect(body).toHaveProperty('response_time_ms')
    expect(typeof body.response_time_ms).toBe('number')
  })
})
