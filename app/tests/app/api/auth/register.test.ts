/**
 * Tests for app/api/auth/register/route.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const kvMock = vi.hoisted(() => ({
  hgetall: vi.fn(),
  hset: vi.fn(),
  sadd: vi.fn(),
}))

vi.mock('@/lib/kv', () => ({
  getRedis: () => kvMock,
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
  },
}))

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  kvMock.hgetall.mockResolvedValue(null)
  kvMock.hset.mockResolvedValue(1)
  kvMock.sadd.mockResolvedValue(1)
})

import { POST } from '@/app/api/auth/register/route'

describe('POST /api/auth/register', () => {
  it('returns 400 when name is missing', async () => {
    const res = await POST(makeRequest({ email: 'a@b.com', password: 'Password1!' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/name.*required/i)
  })

  it('returns 400 when email is missing', async () => {
    const res = await POST(makeRequest({ name: 'John', password: 'Password1!' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/email.*required/i)
  })

  it('returns 400 when password is missing', async () => {
    const res = await POST(makeRequest({ name: 'John', email: 'a@b.com' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/password.*required/i)
  })

  it('returns 400 when email is invalid', async () => {
    const res = await POST(makeRequest({ name: 'John', email: 'invalid', password: 'Password1!' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/valid email/i)
  })

  it('returns 400 when password is too short', async () => {
    const res = await POST(makeRequest({ name: 'John', email: 'a@b.com', password: 'Pass1!' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/at least 8/i)
  })

  it('returns 400 when password has no uppercase', async () => {
    const res = await POST(makeRequest({ name: 'John', email: 'a@b.com', password: 'password1!' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/uppercase/i)
  })

  it('returns 400 when password has no lowercase', async () => {
    const res = await POST(makeRequest({ name: 'John', email: 'a@b.com', password: 'PASSWORD1!' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/lowercase/i)
  })

  it('returns 400 when password has no number', async () => {
    const res = await POST(makeRequest({ name: 'John', email: 'a@b.com', password: 'Password!!' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/number/i)
  })

  it('returns 400 when password has no special character', async () => {
    const res = await POST(makeRequest({ name: 'John', email: 'a@b.com', password: 'Password12' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/special character/i)
  })

  it('returns 409 when email already exists', async () => {
    kvMock.hgetall.mockResolvedValue({ id: 'user-1', email: 'a@b.com' })
    const res = await POST(makeRequest({ name: 'John', email: 'a@b.com', password: 'Password1!' }))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/already exists/i)
  })

  it('stores user and profile on successful registration', async () => {
    const res = await POST(makeRequest({
      name: '  Jane Doe  ',
      email: '  JANE@Example.COM  ',
      password: 'Password1!',
    }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)

    expect(kvMock.hgetall).toHaveBeenCalledWith('user:jane@example.com')
    expect(kvMock.hset).toHaveBeenCalledWith(
      'user:jane@example.com',
      expect.objectContaining({
        email: 'jane@example.com',
        name: 'Jane Doe',
      }),
    )
    expect(kvMock.sadd).toHaveBeenCalledWith('all-users', 'jane@example.com')
    expect(kvMock.hset).toHaveBeenCalledWith(
      'profile:jane@example.com',
      expect.objectContaining({
        full_name: 'Jane Doe',
      }),
    )
  })

  it('returns 500 for invalid JSON body', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const req = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: 'not-json',
      headers: { 'content-type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
    consoleSpy.mockRestore()
  })
})
