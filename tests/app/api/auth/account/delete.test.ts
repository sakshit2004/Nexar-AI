/**
 * Tests for app/api/auth/account/delete/route.ts
 * Mocks: lib/auth, lib/kv
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockAuth, kvMock } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  kvMock: { del: vi.fn(), srem: vi.fn() },
}))

vi.mock('@/lib/auth', () => ({ auth: () => mockAuth() }))
vi.mock('@/lib/kv', () => ({ kv: kvMock }))

beforeEach(() => {
  vi.clearAllMocks()
})

import { POST } from '@/app/api/auth/account/delete/route'

function makeRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/auth/account/delete', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

describe('POST /api/auth/account/delete', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest({ email: 'user@example.com' }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 401 when session has no email', async () => {
    mockAuth.mockResolvedValue({ user: {} })
    const res = await POST(makeRequest({ email: 'user@example.com' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when request body is invalid JSON', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'user@example.com' } })
    const req = new NextRequest('http://localhost/api/auth/account/delete', {
      method: 'POST',
      body: 'not-json',
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/Invalid request body/)
  })

  it('returns 400 when email is missing', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'user@example.com' } })
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/enter your email|confirm/)
  })

  it('returns 400 when email does not match session', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'user@example.com' } })
    const res = await POST(makeRequest({ email: 'different@example.com' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/does not match|full email/)
  })

  it('deletes account and returns success when email matches', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'user@example.com' } })
    kvMock.del.mockResolvedValue(1)
    kvMock.srem.mockResolvedValue(1)

    const res = await POST(makeRequest({ email: 'user@example.com' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)

    expect(kvMock.del).toHaveBeenCalledWith('user:user@example.com')
    expect(kvMock.del).toHaveBeenCalledWith('profile:user@example.com')
    expect(kvMock.del).toHaveBeenCalledWith('saved:user@example.com')
    expect(kvMock.srem).toHaveBeenCalledWith('all-users', 'user@example.com')
  })

  it('handles email case insensitively', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'User@Example.COM' } })
    kvMock.del.mockResolvedValue(1)
    kvMock.srem.mockResolvedValue(1)

    const res = await POST(makeRequest({ email: 'user@example.com' }))
    expect(res.status).toBe(200)
    expect(kvMock.del).toHaveBeenCalledWith('user:user@example.com')
  })

  it('returns 500 when KV throws', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'user@example.com' } })
    kvMock.del.mockRejectedValue(new Error('Redis error'))

    const res = await POST(makeRequest({ email: 'user@example.com' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/Failed to delete|try again/)
  })
})
