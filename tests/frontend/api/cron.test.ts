/**
 * Tests for app/api/cron/deadline-check/route.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { kvMock, mockGetGrant, mockSendDeadlineAlert } = vi.hoisted(() => ({
  kvMock: { smembers: vi.fn() },
  mockGetGrant: vi.fn(),
  mockSendDeadlineAlert: vi.fn(),
}))

vi.mock('@/lib/kv', () => ({ kv: kvMock }))
vi.mock('@/lib/grant-cache', () => ({ getGrant: (...args: unknown[]) => mockGetGrant(...args) }))
vi.mock('@/lib/email', () => ({ sendDeadlineAlert: (...args: unknown[]) => mockSendDeadlineAlert(...args) }))

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost/api/cron/deadline-check', { headers })
}

/**
 * Produce a YYYY-MM-DD deadline string so that the cron route's daysUntil()
 * function returns exactly `wantedDays`.
 *
 * The route does: `new Date(dateStr).setHours(0,0,0,0) - now.setHours(0,0,0,0)`
 * Date-only strings are parsed as UTC midnight, which when converted to local
 * time with setHours(0,0,0,0) shifts by the UTC offset. To get the right
 * round-trip value we add (wantedDays + 1) local days and format in LOCAL time.
 */
function deadlineForDaysUntil(wantedDays: number): string {
  const now = new Date()
  const localMidnightMs = now.setHours(0, 0, 0, 0)
  // +1 compensates for the UTC-parse → local-midnight shift in daysUntil()
  const target = new Date(localMidnightMs + (wantedDays + 1) * 86400000)
  const year = target.getFullYear()
  const month = String(target.getMonth() + 1).padStart(2, '0')
  const day = String(target.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.CRON_SECRET = 'test-secret'
})

import { GET } from '@/app/api/cron/deadline-check/route'

describe('GET /api/cron/deadline-check', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.detail).toBe('Unauthorized')
  })

  it('returns 401 when Authorization header has wrong secret', async () => {
    const res = await GET(makeRequest({ authorization: 'Bearer wrong-secret' }))
    expect(res.status).toBe(401)
  })

  it('returns 401 when CRON_SECRET env var is not set', async () => {
    delete process.env.CRON_SECRET
    const res = await GET(makeRequest({ authorization: 'Bearer anything' }))
    expect(res.status).toBe(401)
  })

  it('returns ok=true with 0 emails when no users', async () => {
    kvMock.smembers.mockResolvedValue([])
    const res = await GET(makeRequest({ authorization: 'Bearer test-secret' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.processed).toBe(0)
    expect(body.emailsSent).toBe(0)
  })

  it('sends email for grant due in 7 days', async () => {
    const deadline7 = deadlineForDaysUntil(7)
    kvMock.smembers
      .mockResolvedValueOnce(['user@example.com'])     // all-users
      .mockResolvedValueOnce(['g1'])                   // saved:user@example.com
    const grant = { id: 'g1', title: 'Grant 1', deadline: deadline7 }
    mockGetGrant.mockResolvedValue(grant)
    mockSendDeadlineAlert.mockResolvedValue({ data: { id: 'email1' } })

    const res = await GET(makeRequest({ authorization: 'Bearer test-secret' }))
    const body = await res.json()
    expect(body.emailsSent).toBe(1)
    expect(mockSendDeadlineAlert).toHaveBeenCalledWith('user@example.com', grant, 7)
  })

  it('sends email for grant due in 1 day', async () => {
    const deadline1 = deadlineForDaysUntil(1)
    kvMock.smembers
      .mockResolvedValueOnce(['user@example.com'])
      .mockResolvedValueOnce(['g2'])
    const grant = { id: 'g2', title: 'Grant 2', deadline: deadline1 }
    mockGetGrant.mockResolvedValue(grant)
    mockSendDeadlineAlert.mockResolvedValue({})

    const res = await GET(makeRequest({ authorization: 'Bearer test-secret' }))
    const body = await res.json()
    expect(body.emailsSent).toBe(1)
    expect(mockSendDeadlineAlert).toHaveBeenCalledWith('user@example.com', grant, 1)
  })

  it('does not send email for grant due in 14 days', async () => {
    kvMock.smembers
      .mockResolvedValueOnce(['user@example.com'])
      .mockResolvedValueOnce(['g3'])
    mockGetGrant.mockResolvedValue({ id: 'g3', title: 'Grant 3', deadline: deadlineForDaysUntil(14) })

    const res = await GET(makeRequest({ authorization: 'Bearer test-secret' }))
    const body = await res.json()
    expect(body.emailsSent).toBe(0)
    expect(mockSendDeadlineAlert).not.toHaveBeenCalled()
  })

  it('skips grant with no deadline', async () => {
    kvMock.smembers
      .mockResolvedValueOnce(['user@example.com'])
      .mockResolvedValueOnce(['g4'])
    mockGetGrant.mockResolvedValue({ id: 'g4', title: 'Grant 4', deadline: '' })

    const res = await GET(makeRequest({ authorization: 'Bearer test-secret' }))
    const body = await res.json()
    expect(body.emailsSent).toBe(0)
  })

  it('skips null/missing grants (not in cache)', async () => {
    kvMock.smembers
      .mockResolvedValueOnce(['user@example.com'])
      .mockResolvedValueOnce(['g-missing'])
    mockGetGrant.mockResolvedValue(null)

    const res = await GET(makeRequest({ authorization: 'Bearer test-secret' }))
    expect(mockSendDeadlineAlert).not.toHaveBeenCalled()
  })

  it('continues processing other users if one email fails', async () => {
    kvMock.smembers
      .mockResolvedValueOnce(['user1@example.com', 'user2@example.com'])
      .mockResolvedValueOnce(['g1'])  // user1 grants
      .mockResolvedValueOnce(['g2'])  // user2 grants
    const grant7 = { id: 'g1', title: 'Grant 1', deadline: deadlineForDaysUntil(7) }
    const grant1 = { id: 'g2', title: 'Grant 2', deadline: deadlineForDaysUntil(1) }
    mockGetGrant.mockImplementation(async (id: string) => (id === 'g1' ? grant7 : grant1))
    mockSendDeadlineAlert
      .mockRejectedValueOnce(new Error('Email send failed'))
      .mockResolvedValueOnce({})

    const res = await GET(makeRequest({ authorization: 'Bearer test-secret' }))
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.processed).toBe(2)
    // Second email still sent even though first failed
    expect(body.emailsSent).toBe(1)
  })

  it('returns 500 when all-users KV fetch fails', async () => {
    kvMock.smembers.mockRejectedValue(new Error('Redis unavailable'))
    const res = await GET(makeRequest({ authorization: 'Bearer test-secret' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.error).toBe('Redis unavailable')
  })
})
