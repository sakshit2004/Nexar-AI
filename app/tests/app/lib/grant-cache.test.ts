/**
 * Tests for lib/grant-cache.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hasFutureDeadline, storeGrant, storeGrants, getGrant } from '@/lib/grant-cache'
import type { Grant } from '@/lib/grant-cache'

const kvMock = vi.hoisted(() => ({
  set: vi.fn(),
  get: vi.fn(),
}))

vi.mock('@/lib/kv', () => ({ kv: kvMock }))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('hasFutureDeadline', () => {
  it('returns true when deadline is empty', () => {
    expect(hasFutureDeadline({ deadline: '' })).toBe(true)
    expect(hasFutureDeadline({ deadline: undefined } as unknown as { deadline: string })).toBe(true)
  })

  it('returns true when deadline is in the future', () => {
    const future = new Date()
    future.setFullYear(future.getFullYear() + 1)
    expect(hasFutureDeadline({ deadline: future.toISOString() })).toBe(true)
    expect(hasFutureDeadline({ deadline: '2030-12-31' })).toBe(true)
  })

  it('returns false when deadline is in the past', () => {
    const past = new Date()
    past.setFullYear(past.getFullYear() - 1)
    expect(hasFutureDeadline({ deadline: past.toISOString() })).toBe(false)
    expect(hasFutureDeadline({ deadline: '2020-01-01' })).toBe(false)
  })

  it('returns true when deadline is unparseable (keeps grant to avoid filtering valid opportunities)', () => {
    expect(hasFutureDeadline({ deadline: 'invalid-date' })).toBe(true)
    expect(hasFutureDeadline({ deadline: 'not-a-date' })).toBe(true)
    expect(hasFutureDeadline({ deadline: 'TBD' })).toBe(true)
  })

  it('returns true for rolling deadline (empty string)', () => {
    expect(hasFutureDeadline({ deadline: '' })).toBe(true)
  })

  it('handles YYYY-MM-DD format', () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().slice(0, 10)
    expect(hasFutureDeadline({ deadline: tomorrowStr })).toBe(true)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)
    expect(hasFutureDeadline({ deadline: yesterdayStr })).toBe(false)
  })
})

describe('storeGrant', () => {
  it('calls kv.set with correct key and TTL when grant has id', async () => {
    kvMock.set.mockResolvedValue(undefined)
    const grant: Grant = {
      id: 'grant-123',
      title: 'Test Grant',
      agency: 'NSF',
      description: '',
      eligibility: '',
      award_amount: 'Varies',
      deadline: '',
      category: 'Technology',
      url: '',
      opportunity_number: '',
    }
    await storeGrant(grant)
    expect(kvMock.set).toHaveBeenCalledWith(
      'grant:grant-123',
      grant,
      expect.objectContaining({ ex: 86400 })
    )
  })

  it('does not call kv when grant has no id', async () => {
    await storeGrant({} as Grant)
    expect(kvMock.set).not.toHaveBeenCalled()
  })

  it('does not call kv when grant is null/undefined', async () => {
    await storeGrant(null as unknown as Grant)
    expect(kvMock.set).not.toHaveBeenCalled()
  })

  it('silently catches Redis errors', async () => {
    kvMock.set.mockRejectedValue(new Error('Redis unavailable'))
    const grant: Grant = {
      id: 'g1',
      title: 'Test',
      agency: 'A',
      description: '',
      eligibility: '',
      award_amount: '',
      deadline: '',
      category: 'Technology',
      url: '',
      opportunity_number: '',
    }
    await expect(storeGrant(grant)).resolves.not.toThrow()
  })
})

describe('storeGrants', () => {
  it('stores multiple grants', async () => {
    kvMock.set.mockResolvedValue(undefined)
    const grants: Grant[] = [
      {
        id: 'g1',
        title: 'Grant 1',
        agency: 'A',
        description: '',
        eligibility: '',
        award_amount: '',
        deadline: '',
        category: 'Technology',
        url: '',
        opportunity_number: '',
      },
      {
        id: 'g2',
        title: 'Grant 2',
        agency: 'B',
        description: '',
        eligibility: '',
        award_amount: '',
        deadline: '',
        category: 'Education',
        url: '',
        opportunity_number: '',
      },
    ]
    await storeGrants(grants)
    expect(kvMock.set).toHaveBeenCalledTimes(2)
    expect(kvMock.set).toHaveBeenCalledWith('grant:g1', grants[0], expect.any(Object))
    expect(kvMock.set).toHaveBeenCalledWith('grant:g2', grants[1], expect.any(Object))
  })

  it('does nothing for empty array', async () => {
    await storeGrants([])
    expect(kvMock.set).not.toHaveBeenCalled()
  })
})

describe('getGrant', () => {
  it('returns grant when found in KV', async () => {
    const grant: Grant = {
      id: 'g1',
      title: 'Test',
      agency: 'NSF',
      description: 'Desc',
      eligibility: 'Univ',
      award_amount: '$50k',
      deadline: '2025-12-31',
      category: 'Science',
      url: 'https://example.com',
      opportunity_number: 'OPP-123',
    }
    kvMock.get.mockResolvedValue(grant)
    const result = await getGrant('g1')
    expect(result).toEqual(grant)
    expect(kvMock.get).toHaveBeenCalledWith('grant:g1')
  })

  it('returns null when key does not exist', async () => {
    kvMock.get.mockResolvedValue(null)
    const result = await getGrant('nonexistent')
    expect(result).toBeNull()
  })

  it('returns null when KV throws', async () => {
    kvMock.get.mockRejectedValue(new Error('Redis error'))
    const result = await getGrant('g1')
    expect(result).toBeNull()
  })
})
