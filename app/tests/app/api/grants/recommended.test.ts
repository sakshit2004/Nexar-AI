/**
 * Tests for app/api/v1/grants/recommended/route.ts
 * Mocks: lib/grant-utils (searchWithOpenAI, searchWithAnthropic), lib/grant-cache (storeGrants)
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

import { GET } from '@/app/api/v1/grants/recommended/route'

const sampleGrant = {
  id: 'g1',
  title: 'Community Grant',
  agency: 'HHS',
  description: 'Health',
  eligibility: 'Nonprofits',
  award_amount: '$100k',
  deadline: '2026-06-30',
  category: 'Health',
  url: 'https://example.com',
  opportunity_number: 'OPP-2',
}

function makeRequest(params?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/v1/grants/recommended')
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  return new NextRequest(url.toString())
}

describe('GET /api/v1/grants/recommended', () => {
  it('returns 503 when no API keys configured', async () => {
    const res = await GET(makeRequest({ q: 'education' }))
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.detail).toMatch(/not configured|OPENAI_API_KEY|ANTHROPIC_API_KEY/)
  })

  it('returns grants when OpenAI is configured', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    mockSearchOpenAI.mockResolvedValue([sampleGrant])
    const res = await GET(makeRequest({ q: 'STEM education' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.grants).toHaveLength(1)
    expect(body.provider).toBe('openai')
    expect(body.personalized).toBe(true)
  })

  it('sets personalized false for default query', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    mockSearchOpenAI.mockResolvedValue([])
    const res = await GET(makeRequest({ q: 'grants USA' }))
    const body = await res.json()
    expect(body.personalized).toBe(false)
  })

  it('builds search query with "open grants for" for short queries', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    mockSearchOpenAI.mockResolvedValue([])
    await GET(makeRequest({ q: 'education' }))
    expect(mockSearchOpenAI).toHaveBeenCalledWith(
      expect.stringMatching(/open grants for education USA/),
      expect.any(Number),
      'sk-test'
    )
  })

  it('appends variety phrase when seed param is provided', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    mockSearchOpenAI.mockResolvedValue([])
    await GET(makeRequest({ q: 'arts', seed: '1' }))
    const callQuery = mockSearchOpenAI.mock.calls[0][0]
    expect(callQuery).toMatch(/STEM|science|education|research|arts|culture/)
  })

  it('falls back to Anthropic when OpenAI fails', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test'
    mockSearchOpenAI.mockRejectedValue(new Error('OpenAI error'))
    mockSearchAnthropic.mockResolvedValue([sampleGrant])
    const res = await GET(makeRequest({ q: 'test' }))
    expect(res.status).toBe(200)
    expect(res.body).toBeDefined()
    const body = await res.json()
    expect(body.provider).toBe('anthropic (fallback)')
  })

  it('returns 500 when both providers fail', async () => {
    process.env.OPENAI_API_KEY = 'sk-test'
    mockSearchOpenAI.mockRejectedValue(new Error('Fail'))
    const res = await GET(makeRequest({ q: 'test' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.detail).toMatch(/Grant search failed/)
  })
})
