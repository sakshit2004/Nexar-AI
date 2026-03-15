/**
 * Tests for app/api/v1/grants/[id]/route.ts
 * Mocks: lib/grant-cache (getGrant)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockGetGrant = vi.hoisted(() => vi.fn())

vi.mock('@/lib/grant-cache', () => ({
  getGrant: (...args: unknown[]) => mockGetGrant(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

import { GET } from '@/app/api/v1/grants/[id]/route'

const sampleGrant = {
  id: 'grant-123',
  title: 'STEM Education Grant',
  agency: 'National Science Foundation',
  description: 'Funds for education',
  eligibility: 'Universities',
  award_amount: '$50,000',
  deadline: '2026-12-31',
  category: 'Education',
  url: 'https://grants.gov/123',
  opportunity_number: 'CFDA-123',
}

describe('GET /api/v1/grants/[id]', () => {
  it('returns grant when found in cache', async () => {
    mockGetGrant.mockResolvedValue(sampleGrant)
    const req = new NextRequest('http://localhost/api/v1/grants/grant-123')
    const res = await GET(req, { params: Promise.resolve({ id: 'grant-123' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual(sampleGrant)
    expect(body.title).toBe('STEM Education Grant')
    expect(mockGetGrant).toHaveBeenCalledWith('grant-123')
  })

  it('returns 404 when grant not found', async () => {
    mockGetGrant.mockResolvedValue(null)
    const res = await GET(new NextRequest('http://localhost'), {
      params: Promise.resolve({ id: 'nonexistent' }),
    })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.detail).toMatch(/not found|nonexistent/)
  })

  it('returns 404 with helpful message for missing grant', async () => {
    mockGetGrant.mockResolvedValue(null)
    const res = await GET(new NextRequest('http://localhost'), {
      params: Promise.resolve({ id: 'missing-id' }),
    })
    const body = await res.json()
    expect(body.detail).toContain('missing-id')
    expect(body.detail).toMatch(/search results/)
  })
})
