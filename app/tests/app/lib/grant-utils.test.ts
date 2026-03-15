/**
 * Tests for lib/grant-utils.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parseGrantsJson,
  normalizeGrant,
  EXTRACTION_PROMPT,
  searchWithOpenAI,
  searchWithAnthropic,
} from '@/lib/grant-utils'

describe('parseGrantsJson', () => {
  it('returns empty array for empty string', () => {
    expect(parseGrantsJson('')).toEqual([])
    expect(parseGrantsJson('   ')).toEqual([])
  })

  it('returns empty array for null/undefined-like input', () => {
    expect(parseGrantsJson('')).toEqual([])
  })

  it('parses plain JSON array', () => {
    const input = '[{"id":"g1","title":"Test Grant","agency":"NSF"}]'
    expect(parseGrantsJson(input)).toEqual([{ id: 'g1', title: 'Test Grant', agency: 'NSF' }])
  })

  it('parses JSON array with markdown code block', () => {
    const input = '```json\n[{"id":"g1","title":"Test"}]```'
    expect(parseGrantsJson(input)).toEqual([{ id: 'g1', title: 'Test' }])
  })

  it('parses JSON array with ``` only (no json)', () => {
    const input = '```\n[{"id":"g1"}]```'
    expect(parseGrantsJson(input)).toEqual([{ id: 'g1' }])
  })

  it('extracts array from text with surrounding content', () => {
    const input = 'Here are the grants:\n[{"id":"g1","title":"A"}]'
    expect(parseGrantsJson(input)).toEqual([{ id: 'g1', title: 'A' }])
  })

  it('parses wrapper object with grants key', () => {
    const input = '{"grants":[{"id":"g1","title":"Test"}]}'
    expect(parseGrantsJson(input)).toEqual([{ id: 'g1', title: 'Test' }])
  })

  it('filters out null and non-object entries', () => {
    const input = '[{"id":"g1"}, null, {"id":"g2"}, "string", 42]'
    expect(parseGrantsJson(input)).toEqual([{ id: 'g1' }, { id: 'g2' }])
  })

  it('returns empty array for invalid JSON', () => {
    expect(parseGrantsJson('not json')).toEqual([])
    expect(parseGrantsJson('{invalid}')).toEqual([])
    expect(parseGrantsJson('[]]')).toEqual([])
  })

  it('returns empty array for JSON that is not array or grants object', () => {
    expect(parseGrantsJson('{"foo":"bar"}')).toEqual([])
    expect(parseGrantsJson('"string"')).toEqual([])
    expect(parseGrantsJson('123')).toEqual([])
  })
})

describe('normalizeGrant', () => {
  it('normalizes full grant object', () => {
    const input = {
      id: 'opp-123',
      title: 'STEM Education Grant',
      agency: 'National Science Foundation',
      description: 'Funds for education',
      eligibility: 'Universities',
      award_amount: '$50,000',
      deadline: '2025-12-31',
      category: 'Education',
      url: 'https://grants.gov/123',
      opportunity_number: 'CFDA-123',
    }
    expect(normalizeGrant(input)).toEqual({
      id: 'opp-123',
      title: 'STEM Education Grant',
      agency: 'National Science Foundation',
      description: 'Funds for education',
      eligibility: 'Universities',
      award_amount: '$50,000',
      deadline: '2025-12-31',
      category: 'Education',
      url: 'https://grants.gov/123',
      opportunity_number: 'CFDA-123',
    })
  })

  it('uses opportunity_number as id when id is missing', () => {
    const input = {
      opportunity_number: 'CFDA-456',
      title: 'Test',
      agency: 'DOE',
    }
    expect(normalizeGrant(input).id).toBe('CFDA-456')
  })

  it('generates slug from title and agency when id and opportunity_number missing', () => {
    const input = {
      title: 'Green Energy Initiative',
      agency: 'Department of Energy',
    }
    const result = normalizeGrant(input)
    expect(result.id).toBe('green-energy-initiative-department-of-energy')
    expect(result.id).toMatch(/^[a-z0-9-]+$/)
    expect(result.id.length).toBeLessThanOrEqual(60)
  })

  it('truncates slug to 60 characters', () => {
    const longTitle = 'A'.repeat(50)
    const longAgency = 'B'.repeat(50)
    const result = normalizeGrant({ title: longTitle, agency: longAgency })
    expect(result.id.length).toBeLessThanOrEqual(60)
  })

  it('uses defaults for missing string fields', () => {
    const input = {}
    const result = normalizeGrant(input)
    expect(result.title).toBe('Untitled Grant')
    expect(result.agency).toBe('Granting Organization')
    expect(result.description).toBe('')
    expect(result.eligibility).toBe('')
    expect(result.award_amount).toBe('Varies')
    expect(result.deadline).toBe('')
    expect(result.category).toBe('Technology')
    expect(result.url).toBe('')
    expect(result.opportunity_number).toBe('')
    expect(typeof result.id).toBe('string')
  })

  it('coerces non-string values to empty string', () => {
    const input = {
      id: 'g1',
      title: 123,
      agency: null,
      description: undefined,
    }
    const result = normalizeGrant(input)
    expect(result.title).toBe('Untitled Grant')
    expect(result.agency).toBe('Granting Organization')
    expect(result.description).toBe('')
  })

  it('handles empty deadline', () => {
    const input = { id: 'g1', title: 'Test', deadline: '' }
    expect(normalizeGrant(input).deadline).toBe('')
  })
})

describe('EXTRACTION_PROMPT', () => {
  it('contains placeholder placeholders for query and limit', () => {
    expect(EXTRACTION_PROMPT).toContain('{query}')
    expect(EXTRACTION_PROMPT).toContain('{limit}')
  })
})

describe('searchWithOpenAI', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  it('returns normalized grants from OpenAI response', async () => {
    const jsonResponse = [
      {
        id: 'g1',
        title: 'STEM Grant',
        agency: 'NSF',
        description: 'Education',
        eligibility: 'Universities',
        award_amount: '$50k',
        deadline: '2026-12-31',
        category: 'Education',
        url: 'https://example.com',
        opportunity_number: 'OPP-1',
      },
    ]
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: JSON.stringify(jsonResponse) } }] }),
    })

    const result = await searchWithOpenAI('education grants', 5, 'sk-test')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('STEM Grant')
    expect(result[0].agency).toBe('NSF')
    expect(fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer sk-test' }),
      })
    )
  })

  it('throws on API error', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    })

    await expect(searchWithOpenAI('test', 5, 'sk-test')).rejects.toThrow(/OpenAI API error 500/)
  })

  it('returns empty array when response has no content', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: '' } }] }),
    })

    const result = await searchWithOpenAI('test', 5, 'sk-test')
    expect(result).toEqual([])
  })
})

describe('searchWithAnthropic', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  it('returns normalized grants from Anthropic response', async () => {
    const jsonResponse = [
      {
        id: 'g2',
        title: 'Health Grant',
        agency: 'HHS',
        description: 'Public health',
        eligibility: 'Nonprofits',
        award_amount: '$100k',
        deadline: '2026-06-30',
        category: 'Health',
        url: 'https://example.com/2',
        opportunity_number: 'OPP-2',
      },
    ]
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [{ type: 'text', text: JSON.stringify(jsonResponse) }],
        }),
    })

    const result = await searchWithAnthropic('health grants', 10, 'sk-ant-test')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Health Grant')
    expect(result[0].category).toBe('Health')
    expect(fetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-api-key': 'sk-ant-test' }),
      })
    )
  })

  it('throws on API error', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 429,
      text: () => Promise.resolve('Rate limited'),
    })

    await expect(searchWithAnthropic('test', 5, 'sk-ant-test')).rejects.toThrow(
      /Anthropic API error 429/
    )
  })

  it('concatenates multiple text blocks', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          content: [
            { type: 'text', text: '[{"id":"g1","title":"Partial' },
            { type: 'text', text: ' Grant","agency":"DOE"}]' },
          ],
        }),
    })

    const result = await searchWithAnthropic('test', 5, 'sk-ant-test')
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Partial Grant')
    expect(result[0].agency).toBe('DOE')
  })
})
