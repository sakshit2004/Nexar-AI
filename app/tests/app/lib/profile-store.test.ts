/**
 * Tests for lib/profile-store.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function mockOkJson(data: unknown) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(data) } as Response)
}

beforeEach(async () => {
  mockFetch.mockReset()
  const { useProfileStore } = await import('@/lib/profile-store')
  useProfileStore.setState({ profile: null, hydrated: false })
})

describe('useProfileStore', () => {
  it('starts with null profile and hydrated=false', async () => {
    const { useProfileStore } = await import('@/lib/profile-store')
    expect(useProfileStore.getState().profile).toBeNull()
    expect(useProfileStore.getState().hydrated).toBe(false)
  })

  it('fetchProfile hydrates store from API', async () => {
    const profile = {
      organization_name: 'MLH',
      organization_type: 'Education',
      focus_areas: ['Education', 'Tech'],
      keywords: [],
      full_name: '',
      location_state: 'US',
      location_county: '',
      grant_amount_min: null,
      grant_amount_max: null,
      onboarding_completed: false,
      onboarding_step: 0,
    }
    mockFetch.mockReturnValue(mockOkJson({ profile }))
    const { useProfileStore } = await import('@/lib/profile-store')
    await useProfileStore.getState().fetchProfile()
    expect(useProfileStore.getState().profile?.organization_name).toBe('MLH')
    expect(useProfileStore.getState().hydrated).toBe(true)
  })

  it('fetchProfile sets profile=null and hydrated=true on null response', async () => {
    mockFetch.mockReturnValue(mockOkJson({ profile: null }))
    const { useProfileStore } = await import('@/lib/profile-store')
    await useProfileStore.getState().fetchProfile()
    expect(useProfileStore.getState().profile).toBeNull()
    expect(useProfileStore.getState().hydrated).toBe(true)
  })

  it('fetchProfile sets fetchAttempted=true but hydrated=false on non-ok response', async () => {
    mockFetch.mockReturnValue(Promise.resolve({ ok: false } as Response))
    const { useProfileStore } = await import('@/lib/profile-store')
    await useProfileStore.getState().fetchProfile()
    expect(useProfileStore.getState().hydrated).toBe(false)
    expect(useProfileStore.getState().fetchAttempted).toBe(true)
  })

  it('updateProfile merges data optimistically and calls PUT /api/v1/profile', async () => {
    const updatedProfile = {
      organization_name: 'Updated Org',
      organization_type: 'Nonprofit',
      focus_areas: ['Health'],
      keywords: [],
      full_name: '',
      location_state: '',
      location_county: '',
      grant_amount_min: null,
      grant_amount_max: null,
      onboarding_completed: false,
      onboarding_step: 0,
    }
    mockFetch.mockReturnValue(mockOkJson({ profile: updatedProfile }))
    const { useProfileStore } = await import('@/lib/profile-store')
    await useProfileStore.getState().updateProfile({ organization_name: 'Updated Org', organization_type: 'Nonprofit', focus_areas: ['Health'] })
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/profile', expect.objectContaining({ method: 'PUT' }))
    expect(useProfileStore.getState().profile?.organization_name).toBe('Updated Org')
  })

  it('updateProfile preserves existing fields when partial update', async () => {
    const { useProfileStore } = await import('@/lib/profile-store')
    useProfileStore.setState({
      profile: {
        organization_name: 'Existing Org',
        organization_type: 'Education',
        focus_areas: ['Education'],
        keywords: ['fellowship'],
        full_name: 'John',
        location_state: 'CA',
        location_county: '',
        grant_amount_min: null,
        grant_amount_max: null,
        onboarding_completed: false,
        onboarding_step: 0,
      },
    })
    mockFetch.mockReturnValue(mockOkJson({ profile: null }))
    await useProfileStore.getState().updateProfile({ location_state: 'NY' })
    const state = useProfileStore.getState()
    // Should preserve existing fields
    expect(state.profile?.organization_name).toBe('Existing Org')
    expect(state.profile?.location_state).toBe('NY')
  })

  it('clearProfile resets to null', async () => {
    const { useProfileStore } = await import('@/lib/profile-store')
    useProfileStore.setState({
      profile: {
        organization_name: 'Test',
        organization_type: '',
        focus_areas: [],
        keywords: [],
        full_name: '',
        location_state: '',
        location_county: '',
        grant_amount_min: null,
        grant_amount_max: null,
        onboarding_completed: false,
        onboarding_step: 0,
      },
    })
    useProfileStore.getState().clearProfile()
    expect(useProfileStore.getState().profile).toBeNull()
  })

  it('hasProfile returns false when profile is null', async () => {
    const { useProfileStore } = await import('@/lib/profile-store')
    expect(useProfileStore.getState().hasProfile()).toBe(false)
  })

  it('hasProfile returns true when organization_name is set', async () => {
    const { useProfileStore } = await import('@/lib/profile-store')
    useProfileStore.setState({
      profile: {
        organization_name: 'Test Org',
        organization_type: '',
        focus_areas: [],
        keywords: [],
        full_name: '',
        location_state: '',
        location_county: '',
        grant_amount_min: null,
        grant_amount_max: null,
        onboarding_completed: false,
        onboarding_step: 0,
      },
    })
    expect(useProfileStore.getState().hasProfile()).toBe(true)
  })

  it('hasProfile returns true when focus_areas is non-empty', async () => {
    const { useProfileStore } = await import('@/lib/profile-store')
    useProfileStore.setState({
      profile: {
        organization_name: '',
        organization_type: '',
        focus_areas: ['Education'],
        keywords: [],
        full_name: '',
        location_state: '',
        location_county: '',
        grant_amount_min: null,
        grant_amount_max: null,
        onboarding_completed: false,
        onboarding_step: 0,
      },
    })
    expect(useProfileStore.getState().hasProfile()).toBe(true)
  })

  it('hasProfile returns false when profile has no meaningful data', async () => {
    const { useProfileStore } = await import('@/lib/profile-store')
    useProfileStore.setState({
      profile: {
        organization_name: '',
        organization_type: '',
        focus_areas: [],
        keywords: [],
        full_name: '',
        location_state: '',
        location_county: '',
        grant_amount_min: null,
        grant_amount_max: null,
        onboarding_completed: false,
        onboarding_step: 0,
      },
    })
    expect(useProfileStore.getState().hasProfile()).toBe(false)
  })
})
