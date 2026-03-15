import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { OnboardingAssistant } from '@/components/OnboardingAssistant'

// Mock next/link to just render <a>
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('OnboardingAssistant', () => {
  const defaultProps = {
    displayName: 'Jane',
    currentStep: 0,
    profileCompletion: 0,
    hasProfileData: false,
    onAdvanceStep: vi.fn(),
    onComplete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the assistant panel open on first visit (step 0)', () => {
    render(<OnboardingAssistant {...defaultProps} />)
    expect(screen.getByText('Nexar AI Guide')).toBeInTheDocument()
    expect(screen.getByText('Here to help you get started')).toBeInTheDocument()
  })

  it('displays the welcome message with user name', () => {
    render(<OnboardingAssistant {...defaultProps} />)
    expect(
      screen.getByText(/Hey Jane! 👋 I'm your Nexar AI assistant/)
    ).toBeInTheDocument()
  })

  it('shows the progress bar at 1/5 initially', () => {
    render(<OnboardingAssistant {...defaultProps} />)
    expect(screen.getByText('1/5')).toBeInTheDocument()
  })

  it('shows "Next tip" button to advance', () => {
    render(<OnboardingAssistant {...defaultProps} />)
    expect(screen.getByText('Next tip')).toBeInTheDocument()
  })

  it('advances to next message when "Next tip" clicked and calls onAdvanceStep', () => {
    vi.useFakeTimers()
    const onAdvanceStep = vi.fn()
    render(
      <OnboardingAssistant {...defaultProps} onAdvanceStep={onAdvanceStep} />
    )

    fireEvent.click(screen.getByText('Next tip'))

    // Typing indicator should appear
    expect(screen.getByText('Typing...')).toBeInTheDocument()

    // Fast-forward past typing delay
    act(() => {
      vi.advanceTimersByTime(1300)
    })

    expect(onAdvanceStep).toHaveBeenCalledWith(1)
    vi.useRealTimers()
  })

  it('shows "Set Up Profile" action for users with no profile data', () => {
    render(
      <OnboardingAssistant
        {...defaultProps}
        currentStep={1}
        hasProfileData={false}
      />
    )
    // The action button text contains "Set Up Profile"
    const btn = screen.getByRole('button', { name: /Set Up Profile/i })
    expect(btn).toBeInTheDocument()
  })

  it('shows "Complete Profile" action for users with partial profile data', () => {
    render(
      <OnboardingAssistant
        {...defaultProps}
        currentStep={1}
        hasProfileData={true}
        profileCompletion={50}
      />
    )
    const btn = screen.getByRole('button', { name: /Complete Profile/i })
    expect(btn).toBeInTheDocument()
  })

  it('shows "Done" badge when profile is 100% complete', () => {
    render(
      <OnboardingAssistant
        {...defaultProps}
        currentStep={1}
        hasProfileData={true}
        profileCompletion={100}
      />
    )
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('calls onComplete when "Skip" is clicked', () => {
    const onComplete = vi.fn()
    render(<OnboardingAssistant {...defaultProps} onComplete={onComplete} />)

    fireEvent.click(screen.getByText('Skip'))
    expect(onComplete).toHaveBeenCalled()
  })

  it('shows "Complete Setup" button on last step', () => {
    render(
      <OnboardingAssistant
        {...defaultProps}
        currentStep={4}
      />
    )
    const btn = screen.getByRole('button', { name: /Complete Setup/i })
    expect(btn).toBeInTheDocument()
  })

  it('calls onComplete when "Complete Setup" is clicked', () => {
    const onComplete = vi.fn()
    render(
      <OnboardingAssistant
        {...defaultProps}
        currentStep={4}
        onComplete={onComplete}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Complete Setup/i }))
    expect(onComplete).toHaveBeenCalled()
  })

  it('can be minimized and re-opened via floating button', () => {
    render(<OnboardingAssistant {...defaultProps} />)

    // Panel is open initially
    expect(screen.getByText('Nexar AI Guide')).toBeInTheDocument()

    // Click minimize button
    fireEvent.click(screen.getByLabelText('Minimize assistant'))

    // Panel should be closed, floating button visible
    expect(screen.queryByText('Nexar AI Guide')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Open onboarding assistant')).toBeInTheDocument()

    // Click floating button to re-open
    fireEvent.click(screen.getByLabelText('Open onboarding assistant'))
    expect(screen.getByText('Nexar AI Guide')).toBeInTheDocument()
  })

  it('renders profile link for the profile step', () => {
    render(
      <OnboardingAssistant
        {...defaultProps}
        currentStep={1}
        profileCompletion={0}
      />
    )
    const link = screen.getByRole('link', { name: /Set Up Profile/i })
    expect(link).toHaveAttribute('href', '/profile')
  })
})
