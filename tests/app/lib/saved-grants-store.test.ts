/**
 * Tests for lib/saved-grants-store.ts
 * The store is now Zustand-backed with fetch calls to /api/v1/saved.
 * We mock fetch and reset Zustand state between tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function mockOkJson(data: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  } as Response)
}

beforeEach(async () => {
  mockFetch.mockReset()
  // Reset Zustand store state between tests
  const { useSavedGrantsStore } = await import('@/lib/saved-grants-store')
  useSavedGrantsStore.setState({ savedGrants: [], hydrated: false })
})

describe('useSavedGrantsStore', () => {
  it('starts with empty savedGrants and hydrated=false', async () => {
    const { useSavedGrantsStore } = await import('@/lib/saved-grants-store')
    const state = useSavedGrantsStore.getState()
    expect(state.savedGrants).toEqual([])
    expect(state.hydrated).toBe(false)
  })

  it('fetchSaved hydrates the store from API', async () => {
    const grant = { id: 'g1', title: 'Test Grant', agency: 'DOE', description: '', eligibility: '', award_amount: 'Varies', deadline: '', category: 'Education', url: '', opportunity_number: '' }
    mockFetch.mockReturnValue(mockOkJson({ saved_grants: [grant] }))
    const { useSavedGrantsStore } = await import('@/lib/saved-grants-store')
    await useSavedGrantsStore.getState().fetchSaved()
    const state = useSavedGrantsStore.getState()
    expect(state.savedGrants).toHaveLength(1)
    expect(state.savedGrants[0].id).toBe('g1')
    expect(state.hydrated).toBe(true)
  })

  it('fetchSaved sets hydrated=true even on empty response', async () => {
    mockFetch.mockReturnValue(mockOkJson({ saved_grants: [] }))
    const { useSavedGrantsStore } = await import('@/lib/saved-grants-store')
    await useSavedGrantsStore.getState().fetchSaved()
    expect(useSavedGrantsStore.getState().hydrated).toBe(true)
    expect(useSavedGrantsStore.getState().savedGrants).toHaveLength(0)
  })

  it('fetchSaved sets hydrated=true on thrown network error', async () => {
    // The store only sets hydrated=true on non-ok response if it goes to the catch block.
    // A fetch() rejection (network error) does trigger the catch, so hydrated=true.
    mockFetch.mockReturnValue(Promise.reject(new Error('Network error')))
    const { useSavedGrantsStore } = await import('@/lib/saved-grants-store')
    await useSavedGrantsStore.getState().fetchSaved()
    expect(useSavedGrantsStore.getState().hydrated).toBe(true)
  })

  it('fetchSaved leaves hydrated=false on non-ok HTTP response (early return)', async () => {
    // The store currently returns early without setting hydrated on non-ok (e.g. 401).
    // This test documents the current intentional behaviour.
    mockFetch.mockReturnValue(Promise.resolve({ ok: false } as Response))
    const { useSavedGrantsStore } = await import('@/lib/saved-grants-store')
    await useSavedGrantsStore.getState().fetchSaved()
    // hydrated stays false — user is unauthenticated, not yet hydrated
    expect(useSavedGrantsStore.getState().hydrated).toBe(false)
  })

  it('isSaved returns false for unknown grant', async () => {
    const { useSavedGrantsStore } = await import('@/lib/saved-grants-store')
    expect(useSavedGrantsStore.getState().isSaved('g-unknown')).toBe(false)
  })

  it('addGrant performs optimistic add and calls POST /api/v1/saved', async () => {
    mockFetch.mockReturnValue(mockOkJson({ ok: true }))
    const { useSavedGrantsStore } = await import('@/lib/saved-grants-store')
    const grant = { id: 'g1', title: 'Grant 1', agency: 'DOE', description: '', eligibility: '', award_amount: 'Varies', deadline: '', category: 'Education', url: '', opportunity_number: '' }
    await useSavedGrantsStore.getState().addGrant(grant)
    expect(useSavedGrantsStore.getState().savedGrants).toHaveLength(1)
    expect(useSavedGrantsStore.getState().isSaved('g1')).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/saved', expect.objectContaining({ method: 'POST' }))
  })

  it('addGrant does not duplicate if already saved', async () => {
    mockFetch.mockReturnValue(mockOkJson({ ok: true }))
    const { useSavedGrantsStore } = await import('@/lib/saved-grants-store')
    const grant = { id: 'g1', title: 'Grant 1', agency: '', description: '', eligibility: '', award_amount: '', deadline: '', category: '', url: '', opportunity_number: '' }
    await useSavedGrantsStore.getState().addGrant(grant)
    await useSavedGrantsStore.getState().addGrant(grant)
    expect(useSavedGrantsStore.getState().savedGrants).toHaveLength(1)
  })

  it('addGrant rolls back on API failure', async () => {
    mockFetch.mockReturnValue(Promise.reject(new Error('Network error')))
    const { useSavedGrantsStore } = await import('@/lib/saved-grants-store')
    const grant = { id: 'g1', title: 'Grant 1', agency: '', description: '', eligibility: '', award_amount: '', deadline: '', category: '', url: '', opportunity_number: '' }
    await useSavedGrantsStore.getState().addGrant(grant)
    expect(useSavedGrantsStore.getState().savedGrants).toHaveLength(0)
  })

  it('removeGrant performs optimistic remove and calls DELETE /api/v1/saved', async () => {
    const { useSavedGrantsStore } = await import('@/lib/saved-grants-store')
    // Pre-populate store
    useSavedGrantsStore.setState({
      savedGrants: [{ id: 'g1', title: 'Grant 1', agency: '', description: '', eligibility: '', award_amount: '', deadline: '', category: '', url: '', opportunity_number: '' }],
    })
    mockFetch.mockReturnValue(mockOkJson({ ok: true }))
    await useSavedGrantsStore.getState().removeGrant('g1')
    expect(useSavedGrantsStore.getState().savedGrants).toHaveLength(0)
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/saved', expect.objectContaining({ method: 'DELETE' }))
  })

  it('removeGrant rolls back on API failure', async () => {
    const { useSavedGrantsStore } = await import('@/lib/saved-grants-store')
    useSavedGrantsStore.setState({
      savedGrants: [{ id: 'g1', title: 'Grant 1', agency: '', description: '', eligibility: '', award_amount: '', deadline: '', category: '', url: '', opportunity_number: '' }],
    })
    mockFetch.mockReturnValue(Promise.reject(new Error('Network error')))
    await useSavedGrantsStore.getState().removeGrant('g1')
    expect(useSavedGrantsStore.getState().savedGrants).toHaveLength(1)
  })

  it('stats returns correct totals', async () => {
    const { useSavedGrantsStore } = await import('@/lib/saved-grants-store')
    useSavedGrantsStore.setState({
      savedGrants: [
        { id: 'g1', title: 'G1', agency: '', description: '', eligibility: '', award_amount: '', deadline: '', category: 'Education', url: '', opportunity_number: '', is_favorite: true, status: 'saved' },
        { id: 'g2', title: 'G2', agency: '', description: '', eligibility: '', award_amount: '', deadline: '', category: 'Health', url: '', opportunity_number: '', is_favorite: false, status: 'applied' },
      ],
    })
    const stats = useSavedGrantsStore.getState().stats()
    expect(stats.total_saved).toBe(2)
    expect(stats.favorites).toBe(1)
    expect(stats.by_category['Education']).toBe(1)
    expect(stats.by_category['Health']).toBe(1)
    expect(stats.by_status['saved']).toBe(1)
    expect(stats.by_status['applied']).toBe(1)
  })
})
