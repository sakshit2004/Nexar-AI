import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

vi.mock('@/components/landing/GrantVisualization', () => ({
  GrantVisualization: () => <div data-testid="grant-visualization">Grant Demo</div>,
}))

describe('Home Page', () => {
  it('renders hero heading with "Every grant"', () => {
    render(<Home />)
    const matches = screen.getAllByText(/every grant/i)
    expect(matches.length).toBeGreaterThanOrEqual(1)
    expect(matches[0]).toBeInTheDocument()
  })

  it('renders Get Started button linking to /register', () => {
    render(<Home />)
    const links = screen.getAllByRole('link', { name: /get started/i })
    const registerLink = links.find((l) => l.getAttribute('href') === '/register')
    expect(registerLink).toBeDefined()
    expect(registerLink).toBeInTheDocument()
  })

  it('renders GitHub link with correct href', () => {
    render(<Home />)
    const links = screen.getAllByRole('link', { name: /github/i })
    const githubLink = links.find((l) => l.getAttribute('href')?.includes('github.com'))
    expect(githubLink).toBeDefined()
    expect(githubLink).toHaveAttribute('href', 'https://github.com/sakshit2004/Nexar-AI')
    expect(githubLink).toHaveAttribute('target', '_blank')
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders feature list items', () => {
    render(<Home />)
    expect(screen.getByText(/AI Matching/i)).toBeInTheDocument()
    expect(screen.getByText(/Smart Search/i)).toBeInTheDocument()
    expect(screen.getByText(/Plain English/i)).toBeInTheDocument()
    const eligibilityItems = screen.getAllByText(/Eligibility/i)
    expect(eligibilityItems.length).toBeGreaterThanOrEqual(1)
  })

  it('renders GrantVisualization in demo section', () => {
    render(<Home />)
    expect(screen.getByTestId('grant-visualization')).toBeInTheDocument()
  })

  it('renders Stop searching / Start finding CTA section', () => {
    render(<Home />)
    expect(screen.getByText(/stop searching/i)).toBeInTheDocument()
    expect(screen.getByText(/start finding/i)).toBeInTheDocument()
  })

  it('renders Sign up CTA linking to /register', () => {
    render(<Home />)
    const registerLinks = screen.getAllByRole('link', { name: /sign up/i })
    const ctaLink = registerLinks.find((l) => l.getAttribute('href') === '/register')
    expect(ctaLink).toBeDefined()
  })
})
