/**
 * Tests for app/login/page.tsx
 *
 * The login form is two-step:
 *   Step 1 — email input + "Continue" button
 *   Step 2 — password input appears; clicking "Continue" again submits
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mockSignIn = vi.fn()
const mockPush = vi.fn()

vi.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: () => null }),
}))

import LoginPage from '@/app/login/page'

beforeEach(() => {
  mockSignIn.mockReset()
  mockPush.mockReset()
})

/** Fills in the email and advances to password step */
async function fillEmail(email: string) {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } })
  fireEvent.click(screen.getByRole('button', { name: /continue/i }))
  // Wait for password field to appear
  await waitFor(() => screen.getByLabelText(/password/i))
}

describe('Login Page', () => {
  it('renders the page heading "Welcome back"', () => {
    render(<LoginPage />)
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
  })

  it('renders email field on initial load', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('does not render password field on initial load', () => {
    render(<LoginPage />)
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
  })

  it('renders "Continue" button on initial load', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
  })

  it('does not show hardcoded demo credential hints', () => {
    render(<LoginPage />)
    expect(screen.queryByText('admin@mlh.com')).not.toBeInTheDocument()
    expect(screen.queryByText(/Major League Hacking/i)).not.toBeInTheDocument()
  })

  it('reveals password field after clicking Continue with an email', async () => {
    render(<LoginPage />)
    await fillEmail('user@example.com')
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('calls signIn with credentials on second step submit', async () => {
    mockSignIn.mockResolvedValue({ ok: true, error: null })
    render(<LoginPage />)
    await fillEmail('user@example.com')
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'user@example.com',
        password: 'password123',
        redirect: false,
      })
    })
  })

  it('redirects to /dashboard on successful sign-in', async () => {
    mockSignIn.mockResolvedValue({ ok: true, error: null })
    render(<LoginPage />)
    await fillEmail('user@example.com')
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows "Invalid email or password" error on wrong credentials', async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: 'CredentialsSignin' })
    render(<LoginPage />)
    await fillEmail('wrong@email.com')
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    })
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows Signing in... loading state while authenticating', async () => {
    // Make signIn hang long enough to observe loading state
    mockSignIn.mockReturnValue(new Promise(() => {}))
    render(<LoginPage />)
    await fillEmail('user@example.com')
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    await waitFor(() => {
      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
    })
  })

  it('renders "Sign up free" link to /register', () => {
    render(<LoginPage />)
    const signUpLink = screen.getByRole('link', { name: /sign up free/i })
    expect(signUpLink).toHaveAttribute('href', '/register')
  })
})
