/**
 * Tests for lib/email.ts
 * Mocks: resend package, process.env.RESEND_API_KEY
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSend = vi.fn()
vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: (...args: unknown[]) => mockSend(...args) }
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  delete process.env.RESEND_API_KEY
})

import { sendDeadlineAlert } from '@/lib/email'
import type { Grant } from '@/lib/grant-cache'

const sampleGrant: Grant = {
  id: 'g1',
  title: 'STEM Education Grant',
  agency: 'National Science Foundation',
  description: 'Funds for education',
  eligibility: 'Universities',
  award_amount: '$50,000 - $100,000',
  deadline: '2026-03-20',
  category: 'Education',
  url: 'https://grants.gov/123',
  opportunity_number: 'OPP-123',
}

describe('sendDeadlineAlert', () => {
  it('throws when RESEND_API_KEY is not configured', async () => {
    await expect(sendDeadlineAlert('user@example.com', sampleGrant, 7)).rejects.toThrow(
      /RESEND_API_KEY is not configured/
    )
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('sends email with correct subject for 7 days left', async () => {
    process.env.RESEND_API_KEY = 're_test'
    mockSend.mockResolvedValue({ id: 'msg-1' })

    await sendDeadlineAlert('user@example.com', sampleGrant, 7)

    expect(mockSend).toHaveBeenCalledTimes(1)
    const call = mockSend.mock.calls[0][0]
    expect(call.to).toBe('user@example.com')
    expect(call.subject).toContain('STEM Education Grant')
    expect(call.subject).toContain('7 days left')
    expect(call.from).toMatch(/Nexar AI|onboarding@resend/)
  })

  it('sends email with urgency message for 1 day left', async () => {
    process.env.RESEND_API_KEY = 're_test'
    mockSend.mockResolvedValue({ id: 'msg-1' })

    await sendDeadlineAlert('user@example.com', sampleGrant, 1)

    const call = mockSend.mock.calls[0][0]
    expect(call.subject).toContain('Last day')
    expect(call.html).toContain('Last day')
  })

  it('includes grant details in HTML body', async () => {
    process.env.RESEND_API_KEY = 're_test'
    mockSend.mockResolvedValue({ id: 'msg-1' })

    await sendDeadlineAlert('recipient@org.org', sampleGrant, 3)

    const call = mockSend.mock.calls[0][0]
    expect(call.html).toContain('STEM Education Grant')
    expect(call.html).toContain('National Science Foundation')
    expect(call.html).toContain('2026-03-20')
    expect(call.html).toContain('$50,000 - $100,000')
    expect(call.html).toContain('https://grants.gov/123')
  })

  it('omits grant URL link when url is empty', async () => {
    process.env.RESEND_API_KEY = 're_test'
    mockSend.mockResolvedValue({ id: 'msg-1' })
    const grantNoUrl = { ...sampleGrant, url: '' }

    await sendDeadlineAlert('user@example.com', grantNoUrl, 5)

    const call = mockSend.mock.calls[0][0]
    expect(call.html).not.toContain('View grant')
    expect(call.html).not.toContain('href=')
  })
})
