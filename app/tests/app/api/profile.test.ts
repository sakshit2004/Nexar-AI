/**
 * Tests for app/api/v1/profile/route.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockAuth, kvMock } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  kvMock: { hgetall: vi.fn(), hset: vi.fn() },
}))

vi.mock('@/lib/auth', () => ({ auth: () => mockAuth() }))
vi.mock('@/lib/kv', () => ({ kv: kvMock }))

function makeRequest(method: string, body?: unknown): NextRequest {
  return new NextRequest('http://localhost/api/v1/profile', {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'content-type': 'application/json' } : {},
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

import { GET, PUT } from '@/app/api/v1/profile/route'

describe('GET /api/v1/profile', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.detail).toBe('Unauthorized')
  })

  it('returns null profile when key does not exist in KV', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    kvMock.hgetall.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profile).toBeNull()
  })

  it('returns parsed profile with deserialized arrays', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    kvMock.hgetall.mockResolvedValue({
      organization_name: 'Example Organization',
      organization_type: 'Education',
      focus_areas: '["Education","Tech"]',
      keywords: '["education","community"]',
      full_name: 'John',
      location_state: 'CA',
      location_county: '',
      grant_amount_min: '5000',
      grant_amount_max: '50000',
    })
    const res = await GET()
    const body = await res.json()
    expect(body.profile.organization_name).toBe('Example Organization')
    expect(body.profile.focus_areas).toEqual(['Education', 'Tech'])
    expect(body.profile.keywords).toEqual(['education', 'community'])
    expect(body.profile.grant_amount_min).toBe(5000)
    expect(body.profile.grant_amount_max).toBe(50000)
  })

  it('handles malformed JSON arrays gracefully', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    kvMock.hgetall.mockResolvedValue({
      organization_name: 'Org',
      focus_areas: 'not-valid-json',
      keywords: '',
    })
    const res = await GET()
    const body = await res.json()
    expect(body.profile.focus_areas).toEqual([])
    expect(body.profile.keywords).toEqual([])
  })

  it('returns null profile and 200 when KV throws', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    kvMock.hgetall.mockRejectedValue(new Error('Redis error'))
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profile).toBeNull()
  })
})

describe('PUT /api/v1/profile', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await PUT(makeRequest('PUT', { organization_name: 'Test' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid JSON body', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    const req = new NextRequest('http://localhost/api/v1/profile', {
      method: 'PUT',
      body: 'not-json',
      headers: { 'content-type': 'application/json' },
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when no fields to update', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    const res = await PUT(makeRequest('PUT', {}))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.detail).toMatch(/no fields/i)
  })

  it('stores organization_name and returns updated profile', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    kvMock.hset.mockResolvedValue(1)
    kvMock.hgetall.mockResolvedValue({
      organization_name: 'New Org',
      organization_type: '',
      focus_areas: '[]',
      keywords: '[]',
      full_name: '',
      location_state: '',
      location_county: '',
    })
    const res = await PUT(makeRequest('PUT', { organization_name: 'New Org' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(kvMock.hset).toHaveBeenCalledWith(
      'profile:test@example.com',
      expect.objectContaining({ organization_name: 'New Org' }),
    )
    expect(body.profile.organization_name).toBe('New Org')
  })

  it('stores focus_areas as JSON string', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    kvMock.hset.mockResolvedValue(1)
    kvMock.hgetall.mockResolvedValue({ focus_areas: '["Education","Health"]' })
    await PUT(makeRequest('PUT', { focus_areas: ['Education', 'Health'] }))
    expect(kvMock.hset).toHaveBeenCalledWith(
      'profile:test@example.com',
      expect.objectContaining({ focus_areas: '["Education","Health"]' }),
    )
  })

  it('stores grant_amount_min as string', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    kvMock.hset.mockResolvedValue(1)
    kvMock.hgetall.mockResolvedValue({ grant_amount_min: '5000' })
    await PUT(makeRequest('PUT', { grant_amount_min: 5000 }))
    expect(kvMock.hset).toHaveBeenCalledWith(
      'profile:test@example.com',
      expect.objectContaining({ grant_amount_min: '5000' }),
    )
  })

  it('stores null grant_amount_min as empty string', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    kvMock.hset.mockResolvedValue(1)
    kvMock.hgetall.mockResolvedValue({})
    await PUT(makeRequest('PUT', { grant_amount_min: null }))
    expect(kvMock.hset).toHaveBeenCalledWith(
      'profile:test@example.com',
      expect.objectContaining({ grant_amount_min: '' }),
    )
  })

  it('returns 500 when KV throws during save', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    kvMock.hset.mockRejectedValue(new Error('Redis error'))
    const res = await PUT(makeRequest('PUT', { organization_name: 'Org' }))
    expect(res.status).toBe(500)
  })
})
