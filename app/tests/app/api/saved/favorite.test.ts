/**
 * Tests for app/api/v1/saved/favorite/route.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockAuth, kvMock } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  kvMock: { sismember: vi.fn(), sadd: vi.fn(), srem: vi.fn() },
}))

vi.mock('@/lib/auth', () => ({ auth: () => mockAuth() }))
vi.mock('@/lib/kv', () => ({ kv: kvMock }))

beforeEach(() => {
  vi.clearAllMocks()
})

import { POST } from '@/app/api/v1/saved/favorite/route'

function makeRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/v1/saved/favorite', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

describe('POST /api/v1/saved/favorite', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest({ grantId: 'g1' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when grantId is missing', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.detail).toBe('grantId is required')
  })

  it('returns 400 when grant is not saved', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    kvMock.sismember.mockResolvedValue(0)
    const res = await POST(makeRequest({ grantId: 'g1' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.detail).toMatch(/must be saved before favoriting/)
  })

  it('adds grant to favorites when not favorited', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    kvMock.sismember.mockImplementation(async (key: string, id: string) => {
      if (key === 'saved:test@example.com' && id === 'g1') return 1
      if (key === 'favorites:test@example.com' && id === 'g1') return 0
      return 0
    })
    kvMock.sadd.mockResolvedValue(1)
    const res = await POST(makeRequest({ grantId: 'g1' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.is_favorite).toBe(true)
    expect(kvMock.sadd).toHaveBeenCalledWith('favorites:test@example.com', 'g1')
  })

  it('removes grant from favorites when already favorited', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } })
    kvMock.sismember.mockImplementation(async (key: string, id: string) => {
      if (key === 'saved:test@example.com' && id === 'g1') return 1
      if (key === 'favorites:test@example.com' && id === 'g1') return 1
      return 0
    })
    kvMock.srem.mockResolvedValue(1)
    const res = await POST(makeRequest({ grantId: 'g1' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.is_favorite).toBe(false)
    expect(kvMock.srem).toHaveBeenCalledWith('favorites:test@example.com', 'g1')
  })
})
