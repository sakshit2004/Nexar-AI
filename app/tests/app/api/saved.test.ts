/**
 * Tests for app/api/v1/saved/route.ts
 * Mocks: lib/auth (auth()), lib/kv (kv), lib/grant-cache (getGrant)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Mocks — vi.hoisted ensures variables are available when vi.mock factories run
// ---------------------------------------------------------------------------
const { mockAuth, kvMock, mockGetGrant } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  kvMock: { smembers: vi.fn(), sadd: vi.fn(), srem: vi.fn() },
  mockGetGrant: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ auth: () => mockAuth() }))
vi.mock('@/lib/kv', () => ({ kv: kvMock }))
vi.mock('@/lib/grant-cache', () => ({ getGrant: (...args: unknown[]) => mockGetGrant(...args) }))

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function makeRequest(method: string, body?: unknown): NextRequest {
  return new NextRequest('http://localhost/api/v1/saved', {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'content-type': 'application/json' } : {},
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Import route handlers after mocks are in place
// ---------------------------------------------------------------------------
import { GET, POST, DELETE } from '@/app/api/v1/saved/route'

describe('GET /api/v1/saved', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.detail).toBe('Unauthorized')
  })

  it('returns empty list when no grants saved', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    kvMock.smembers.mockResolvedValue([])
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.saved_grants).toEqual([])
    expect(body.total).toBe(0)
  })

  it('returns populated list with grant data and is_favorite', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    kvMock.smembers.mockImplementation(async (key: string) => {
      if (key === 'saved:test@example.com') return ['g1', 'g2']
      if (key === 'favorites:test@example.com') return ['g1']
      return []
    })
    const grant1 = { id: 'g1', title: 'Grant 1', agency: 'DOE', deadline: '2025-07-01', category: 'Education' }
    const grant2 = { id: 'g2', title: 'Grant 2', agency: 'HHS', deadline: '2025-08-01', category: 'Health' }
    mockGetGrant.mockImplementation(async (id: string) => (id === 'g1' ? grant1 : grant2))
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.saved_grants).toHaveLength(2)
    expect(body.total_saved).toBe(2)
    expect(body.favorites).toBe(1)
    expect(body.saved_grants.find((g: { id: string }) => g.id === 'g1').is_favorite).toBe(true)
    expect(body.saved_grants.find((g: { id: string }) => g.id === 'g2').is_favorite).toBe(false)
  })

  it('filters out null grants (not yet cached)', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    kvMock.smembers.mockImplementation(async (key: string) => {
      if (key === 'saved:test@example.com') return ['g1', 'g-missing']
      return []
    })
    mockGetGrant.mockImplementation(async (id: string) => (id === 'g1' ? { id: 'g1', title: 'G1' } : null))
    const res = await GET()
    const body = await res.json()
    expect(body.saved_grants).toHaveLength(1)
  })

  it('returns empty list gracefully when KV throws', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    kvMock.smembers.mockRejectedValue(new Error('Redis unavailable'))
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.saved_grants).toEqual([])
  })
})

describe('POST /api/v1/saved', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest('POST', { grantId: 'g1' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when grantId is missing', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    const res = await POST(makeRequest('POST', {}))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.detail).toBe('grantId is required')
  })

  it('saves grant and tracks user in all-users', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    kvMock.sadd.mockResolvedValue(1)
    const res = await POST(makeRequest('POST', { grantId: 'g1' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.grantId).toBe('g1')
    expect(kvMock.sadd).toHaveBeenCalledWith('saved:test@example.com', 'g1')
    expect(kvMock.sadd).toHaveBeenCalledWith('all-users', 'test@example.com')
  })

  it('returns 500 when KV throws during save', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    kvMock.sadd.mockRejectedValue(new Error('Redis error'))
    const res = await POST(makeRequest('POST', { grantId: 'g1' }))
    expect(res.status).toBe(500)
  })

  it('returns 400 when request body is invalid JSON', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    const req = new NextRequest('http://localhost/api/v1/saved', {
      method: 'POST',
      body: 'not-json',
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.detail).toMatch(/invalid json/i)
  })
})

describe('DELETE /api/v1/saved', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await DELETE(makeRequest('DELETE', { grantId: 'g1' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when grantId is missing', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    const res = await DELETE(makeRequest('DELETE', {}))
    expect(res.status).toBe(400)
  })

  it('removes grant from saved and favorites sets', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    kvMock.srem.mockResolvedValue(1)
    const res = await DELETE(makeRequest('DELETE', { grantId: 'g1' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(kvMock.srem).toHaveBeenCalledWith('saved:test@example.com', 'g1')
    expect(kvMock.srem).toHaveBeenCalledWith('favorites:test@example.com', 'g1')
  })

  it('returns 500 when KV throws during remove', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    kvMock.srem.mockRejectedValue(new Error('Redis error'))
    const res = await DELETE(makeRequest('DELETE', { grantId: 'g1' }))
    expect(res.status).toBe(500)
  })
})
