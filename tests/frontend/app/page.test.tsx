import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Home from '@/app/page'

// Mock Next.js router — useRouter is called in the Home component
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/components/landing/GrantVisualization', () => ({
  GrantVisualization: () => <div data-testid="grant-visualization">Grant Demo</div>,
}))

describe('Home Page', () => {
  it('renders hero heading with "Every grant"', () => {
    render(<Home />)
    expect(screen.getByText(/every grant/i)).toBeInTheDocument()
  })

  it('renders Sign in link in hero', () => {
    render(<Home />)
    const signInLinks = screen.getAllByRole('link', { name: /sign in/i })
    expect(signInLinks.length).toBeGreaterThanOrEqual(1)
    expect(signInLinks[0]).toHaveAttribute('href', '/login')
  })

  it('renders feature list items', () => {
    render(<Home />)
    expect(screen.getByText(/AI Matching/i)).toBeInTheDocument()
    expect(screen.getByText(/Smart Search/i)).toBeInTheDocument()
    expect(screen.getByText(/Plain English/i)).toBeInTheDocument()
    // "Eligibility" may appear multiple times on page; verify at least one exists
    const eligibilityItems = screen.getAllByText(/Eligibility/i)
    expect(eligibilityItems.length).toBeGreaterThanOrEqual(1)
  })

  it('renders GrantVisualization in demo section', () => {
    render(<Home />)
    expect(screen.getByTestId('grant-visualization')).toBeInTheDocument()
  })

  it('renders search input placeholder', () => {
    render(<Home />)
    const input = screen.getByPlaceholderText(/search grants/i)
    expect(input).toBeInTheDocument()
  })

  it('pressing Enter in search input navigates to /search?q=...', () => {
    render(<Home />)
    const input = screen.getByPlaceholderText(/search grants/i)
    fireEvent.change(input, { target: { value: 'education grants' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
    expect(mockPush).toHaveBeenCalledWith('/search?q=education%20grants')
  })

  it('pressing Enter with empty query does not navigate', () => {
    mockPush.mockClear()
    render(<Home />)
    const input = screen.getByPlaceholderText(/search grants/i)
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('Search button navigates to /search?q=...', () => {
    mockPush.mockClear()
    render(<Home />)
    const input = screen.getByPlaceholderText(/search grants/i)
    fireEvent.change(input, { target: { value: 'health research' } })
    const searchBtn = screen.getByRole('button', { name: /search/i })
    fireEvent.click(searchBtn)
    expect(mockPush).toHaveBeenCalledWith('/search?q=health%20research')
  })
})
