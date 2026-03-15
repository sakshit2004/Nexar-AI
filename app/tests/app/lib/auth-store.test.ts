/**
 * Tests for lib/store.ts (Zustand auth store)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// The logout() function uses a dynamic import('next-auth/react') internally.
// We mock the module globally so the dynamic import resolves to our mock.
const mockSignOut = vi.fn()
vi.mock('next-auth/react', () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}))

beforeEach(async () => {
  mockSignOut.mockReset()
  const { useAuthStore } = await import('@/lib/store')
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
})

describe('useAuthStore', () => {
  it('starts unauthenticated with null user and token', async () => {
    const { useAuthStore } = await import('@/lib/store')
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('setAuth sets user, token, and isAuthenticated=true', async () => {
    const { useAuthStore } = await import('@/lib/store')
    useAuthStore.getState().setAuth(
      { id: '1', email: 'test@example.com', name: 'Test', tier: 'premium' },
      'test-token',
    )
    const state = useAuthStore.getState()
    expect(state.user?.email).toBe('test@example.com')
    expect(state.token).toBe('test-token')
    expect(state.isAuthenticated).toBe(true)
  })

  it('setAuth ignores call with falsy values', async () => {
    const { useAuthStore } = await import('@/lib/store')
    // @ts-expect-error intentionally passing null
    useAuthStore.getState().setAuth(null, null)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('clearAuth resets state to unauthenticated', async () => {
    const { useAuthStore } = await import('@/lib/store')
    useAuthStore.getState().setAuth(
      { id: '1', email: 'a@b.com', name: 'A', tier: 'free' },
      'tok',
    )
    useAuthStore.getState().clearAuth()
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('logout clears auth state synchronously', async () => {
    const origWindow = globalThis.window
    // @ts-expect-error suppress dynamic signOut call in jsdom env
    delete globalThis.window
    const { useAuthStore } = await import('@/lib/store')
    useAuthStore.getState().setAuth(
      { id: '1', email: 'a@b.com', name: 'A', tier: 'free' },
      'tok',
    )
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().token).toBeNull()
    globalThis.window = origWindow
  })

  it('logout can be called from any authentication state without throwing', async () => {
    // Ensure window is undefined so the dynamic import branch is not entered
    // (the dynamic import('next-auth/react') path is guarded by typeof window !== 'undefined')
    const origWindow = globalThis.window
    // @ts-expect-error intentionally removing window
    delete globalThis.window
    const { useAuthStore } = await import('@/lib/store')
    expect(() => useAuthStore.getState().logout()).not.toThrow()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    // Restore
    globalThis.window = origWindow
  })
})
