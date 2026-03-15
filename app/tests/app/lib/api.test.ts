/**
 * Tests for lib/api.ts
 * Covers grantsApi, matchingApi, and savedGrantsApi fetch wrappers.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Stub global fetch before importing the module
// ---------------------------------------------------------------------------
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function mockOkJson(data: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  } as Response)
}

function mockErrorJson(status: number, detail: string) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ detail }),
  } as Response)
}

beforeEach(() => {
  mockFetch.mockReset()
  vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } })
})

// ---------------------------------------------------------------------------
// grantsApi
// ---------------------------------------------------------------------------
describe('grantsApi', () => {
  it('search calls /api/v1/grants/search with query params', async () => {
    mockFetch.mockReturnValue(mockOkJson({ grants: [], count: 0 }))
    const { grantsApi } = await import('@/lib/api')
    await grantsApi.search({ q: 'education', category: 'Education' })
    expect(mockFetch).toHaveBeenCalledOnce()
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/v1/grants/search')
    expect(url).toContain('q=education')
    expect(url).toContain('category=Education')
  })

  it('search omits undefined params', async () => {
    mockFetch.mockReturnValue(mockOkJson({ grants: [] }))
    const { grantsApi } = await import('@/lib/api')
    await grantsApi.search({ q: 'health' })
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).not.toContain('category=')
    expect(url).not.toContain('min_amount=')
  })

  it('getById calls /api/v1/grants/:id', async () => {
    const grant = { id: 'g1', title: 'Test Grant' }
    mockFetch.mockReturnValue(mockOkJson(grant))
    const { grantsApi } = await import('@/lib/api')
    const result = await grantsApi.getById('g1')
    expect(mockFetch).toHaveBeenCalledOnce()
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/v1/grants/g1')
    expect(result).toEqual(grant)
  })

  it('getRecommendations calls /api/v1/grants/recommended', async () => {
    mockFetch.mockReturnValue(mockOkJson({ grants: [], personalized: true }))
    const { grantsApi } = await import('@/lib/api')
    await grantsApi.getRecommendations('token', { q: 'science', seed: 2 })
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/v1/grants/recommended')
    expect(url).toContain('q=science')
    expect(url).toContain('seed=2')
  })

  it('throws on non-ok response with detail message', async () => {
    mockFetch.mockReturnValue(mockErrorJson(503, 'Grant discovery not configured.'))
    const { grantsApi } = await import('@/lib/api')
    await expect(grantsApi.search({ q: 'test' })).rejects.toThrow('Grant discovery not configured.')
  })
})

// ---------------------------------------------------------------------------
// matchingApi
// ---------------------------------------------------------------------------
describe('matchingApi', () => {
  it('analyze calls POST /api/v1/grants/:id/analyze with grant body', async () => {
    const response = { ai_summary: 'Good grant.', match_score: 80 }
    mockFetch.mockReturnValue(mockOkJson(response))
    const { matchingApi } = await import('@/lib/api')
    const grantData = { id: 'g1', title: 'Test' }
    const result = await matchingApi.analyze('g1', 'token', grantData)
    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/v1/grants/g1/analyze')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body as string)).toEqual({ grant: grantData })
    expect(result).toEqual(response)
  })

  it('analyze works without grant body', async () => {
    mockFetch.mockReturnValue(mockOkJson({ ai_summary: 'Summary.' }))
    const { matchingApi } = await import('@/lib/api')
    await matchingApi.analyze('g2')
    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(opts.body).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// savedGrantsApi
// ---------------------------------------------------------------------------
describe('savedGrantsApi', () => {
  it('save calls POST /api/v1/saved with grantId', async () => {
    mockFetch.mockReturnValue(mockOkJson({ ok: true, grantId: 'g1' }))
    const { savedGrantsApi } = await import('@/lib/api')
    await savedGrantsApi.save('token', { id: 'g1', title: 'Grant 1' } as Record<string, string>)
    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/v1/saved')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body as string)).toEqual({ grantId: 'g1' })
  })

  it('save throws when grantId is missing', async () => {
    const { savedGrantsApi } = await import('@/lib/api')
    await expect(savedGrantsApi.save('token', {} as Record<string, string>)).rejects.toThrow('grantId is required')
  })

  it('delete calls DELETE /api/v1/saved with grantId', async () => {
    mockFetch.mockReturnValue(mockOkJson({ ok: true }))
    const { savedGrantsApi } = await import('@/lib/api')
    await savedGrantsApi.delete('g1')
    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/v1/saved')
    expect(opts.method).toBe('DELETE')
    expect(JSON.parse(opts.body as string)).toEqual({ grantId: 'g1' })
  })

  it('list returns shaped saved_grants array', async () => {
    const raw = {
      saved_grants: [
        { id: 'g1', title: 'Grant 1', category: 'Education', is_favorite: false, status: 'saved' },
      ],
    }
    mockFetch.mockReturnValue(mockOkJson(raw))
    const { savedGrantsApi } = await import('@/lib/api')
    const result = await savedGrantsApi.list()
    expect(result.saved_grants).toHaveLength(1)
    expect(result.saved_grants[0].grant_id).toBe('g1')
    expect(result.total_saved).toBe(1)
  })

  it('stats returns total_saved and favorites count', async () => {
    const raw = {
      saved_grants: [
        { id: 'g1', is_favorite: true, category: 'Tech' },
        { id: 'g2', is_favorite: false, category: 'Tech' },
      ],
    }
    mockFetch.mockReturnValue(mockOkJson(raw))
    const { savedGrantsApi } = await import('@/lib/api')
    const stats = await savedGrantsApi.stats()
    expect(stats.total_saved).toBe(2)
    expect(stats.favorites).toBe(1)
    expect(stats.by_category['Tech']).toBe(2)
  })

  it('checkSaved returns is_saved true when grant in list', async () => {
    const raw = { saved_grants: [{ id: 'g1' }, { id: 'g2' }] }
    mockFetch.mockReturnValue(mockOkJson(raw))
    const { savedGrantsApi } = await import('@/lib/api')
    const result = await savedGrantsApi.checkSaved('g1')
    expect(result.is_saved).toBe(true)
    expect(result.saved_grant_id).toBe('g1')
  })

  it('checkSaved returns is_saved false when grant not in list', async () => {
    mockFetch.mockReturnValue(mockOkJson({ saved_grants: [{ id: 'g2' }] }))
    const { savedGrantsApi } = await import('@/lib/api')
    const result = await savedGrantsApi.checkSaved('g99')
    expect(result.is_saved).toBe(false)
    expect(result.saved_grant_id).toBeNull()
  })

  it('search filters saved grants by query', async () => {
    const raw = {
      saved_grants: [
        { id: 'g1', title: 'Education Grant', agency: 'DOE' },
        { id: 'g2', title: 'Health Grant', agency: 'HHS' },
      ],
    }
    mockFetch.mockReturnValue(mockOkJson(raw))
    const { savedGrantsApi } = await import('@/lib/api')
    const result = await savedGrantsApi.search('education')
    expect(result.saved_grants).toHaveLength(1)
    expect((result.saved_grants[0] as { title?: string }).title).toBe('Education Grant')
  })
})
