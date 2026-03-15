/**
 * Tests for app/api/v1/grants/[id]/analyze/route.ts
 * Mocks: lib/auth, lib/grant-cache (getGrant), lib/kv, fetch (for LLM calls)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockAuth, mockGetGrant, kvMock } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetGrant: vi.fn(),
  kvMock: { hgetall: vi.fn() },
}))

vi.mock('@/lib/auth', () => ({ auth: () => mockAuth() }))
vi.mock('@/lib/grant-cache', () => ({ getGrant: (...args: unknown[]) => mockGetGrant(...args) }))
vi.mock('@/lib/kv', () => ({ kv: kvMock }))

const sampleGrant = {
  id: 'g1',
  title: 'STEM Grant',
  agency: 'NSF',
  description: 'Education research',
  eligibility: 'Universities',
  award_amount: '$50,000',
  deadline: '2026-12-31',
  category: 'Education',
  url: 'https://example.com',
  opportunity_number: 'OPP-1',
}

beforeEach(() => {
  vi.clearAllMocks()
  delete process.env.OPENAI_API_KEY
  delete process.env.ANTHROPIC_API_KEY
  delete process.env.LLM_PROVIDER

  // Mock fetch for LLM API calls
  globalThis.fetch = vi.fn()
})

import { POST } from '@/app/api/v1/grants/[id]/analyze/route'

function makeRequest(grantInBody?: object): NextRequest {
  return new NextRequest('http://localhost/api/v1/grants/g1/analyze', {
    method: 'POST',
    body: grantInBody ? JSON.stringify(grantInBody) : undefined,
    headers: grantInBody ? { 'content-type': 'application/json' } : {},
  })
}

describe('POST /api/v1/grants/[id]/analyze', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'g1' }) })
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.detail).toBe('Unauthorized')
  })

  it('returns 404 when grant not found and no grant in body', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    mockGetGrant.mockResolvedValue(null)
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'missing' }) })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.detail).toMatch(/not found|missing/)
  })

  it('uses grant from request body when not in cache', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    mockGetGrant.mockResolvedValue(null)
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'This grant supports STEM education for universities.' } }],
        }),
    })
    process.env.OPENAI_API_KEY = 'sk-test'

    const res = await POST(makeRequest({ grant: sampleGrant }), {
      params: Promise.resolve({ id: 'g1' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ai_summary).toContain('STEM')
    expect(body.grant_id).toBe('g1')
  })

  it('returns 503 when no LLM provider configured', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    mockGetGrant.mockResolvedValue(sampleGrant)
    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'g1' }) })
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.detail).toMatch(/not configured|OPENAI_API_KEY|ANTHROPIC_API_KEY/)
  })

  it('returns 500 when LLM call fails', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    mockGetGrant.mockResolvedValue(sampleGrant)
    process.env.OPENAI_API_KEY = 'sk-test'
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
    })

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'g1' }) })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.detail).toMatch(/Analysis failed|OpenAI/)
  })

  it('returns ai_summary and match_score on success', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    mockGetGrant.mockResolvedValue(sampleGrant)
    kvMock.hgetall.mockResolvedValue({
      organization_name: 'Test University',
      organization_type: 'Education',
      focus_areas: '["STEM","Education"]',
      location_state: 'CA',
      grant_amount_min: '10000',
      grant_amount_max: '100000',
    })
    process.env.OPENAI_API_KEY = 'sk-test'
    ;(globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'A plain-English summary of the grant.' } }],
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    status: 'eligible',
                    confidence: 85,
                    reasons: ['University eligibility', 'STEM focus'],
                    missing_info: [],
                  }),
                },
              },
            ],
          }),
      })

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'g1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ai_summary).toBe('A plain-English summary of the grant.')
    expect(body.match_score).toBe(85)
    expect(body.eligibility).toBeDefined()
    expect(body.eligibility.status).toBe('eligible')
    expect(body.eligibility.confidence).toBe(85)
  })

  it('succeeds without eligibility when profile is empty', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    mockGetGrant.mockResolvedValue(sampleGrant)
    kvMock.hgetall.mockResolvedValue(null)
    process.env.OPENAI_API_KEY = 'sk-test'
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'Summary without eligibility.' } }],
        }),
    })

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: 'g1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ai_summary).toBe('Summary without eligibility.')
    expect(body.match_score).toBe(75) // default when no eligibility
  })
})
