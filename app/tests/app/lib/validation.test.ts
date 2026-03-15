/**
 * Tests for lib/validation.ts
 */
import { describe, it, expect } from 'vitest'
import {
  isValidEmail,
  getPasswordStrength,
  validatePassword,
} from '@/lib/validation'

describe('isValidEmail', () => {
  it('returns true for valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('test.user+tag@domain.co.uk')).toBe(true)
    expect(isValidEmail('a@b.co')).toBe(true)
    expect(isValidEmail('  user@example.com  ')).toBe(true)
  })

  it('returns false for invalid emails', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('invalid')).toBe(false)
    expect(isValidEmail('missing@domain')).toBe(false)
    expect(isValidEmail('@domain.com')).toBe(false)
    expect(isValidEmail('user@.com')).toBe(false)
    expect(isValidEmail('user@domain')).toBe(false)
  })

  it('returns false for non-string input', () => {
    expect(isValidEmail(null as unknown as string)).toBe(false)
    expect(isValidEmail(undefined as unknown as string)).toBe(false)
    expect(isValidEmail(123 as unknown as string)).toBe(false)
  })

  it('returns false for email exceeding 254 chars', () => {
    const longLocal = 'a'.repeat(250) + '@b.com'
    expect(isValidEmail(longLocal)).toBe(false)
  })
})

describe('getPasswordStrength', () => {
  it('returns weak for empty or very short password', () => {
    const result = getPasswordStrength('')
    expect(result.strength).toBe('weak')
    expect(result.score).toBe(0)
    expect(result.criteria.length).toBe(false)
  })

  it('returns weak when only one non-length criterion is met', () => {
    const result = getPasswordStrength('A')
    expect(result.strength).toBe('weak')
    expect(result.criteria.length).toBe(false)
    expect(result.criteria.uppercase).toBe(true)
  })

  it('returns fair when 2 criteria met', () => {
    const result = getPasswordStrength('aaaaaaaa')
    expect(result.strength).toBe('fair')
    expect(result.score).toBe(2)
    expect(result.criteria).toEqual({
      length: true,
      uppercase: false,
      lowercase: true,
      number: false,
      special: false,
    })
  })

  it('returns good when 3-4 criteria met', () => {
    const result = getPasswordStrength('Password1')
    expect(result.strength).toBe('good')
    expect(result.criteria.uppercase).toBe(true)
    expect(result.criteria.lowercase).toBe(true)
    expect(result.criteria.number).toBe(true)
  })

  it('returns strong when all 5 criteria met', () => {
    const result = getPasswordStrength('Password1!')
    expect(result.strength).toBe('strong')
    expect(result.score).toBe(5)
    expect(result.criteria).toEqual({
      length: true,
      uppercase: true,
      lowercase: true,
      number: true,
      special: true,
    })
  })

  it('recognizes special characters', () => {
    const specialChars = '!@#$%^&*()_+-=[]{};\':"|,.<>/?`~'
    for (const c of specialChars) {
      const result = getPasswordStrength(`Password1${c}`)
      expect(result.criteria.special).toBe(true)
    }
  })

  it('returns correct label for each strength', () => {
    expect(getPasswordStrength('').label).toBe('Weak')
    expect(getPasswordStrength('aaaaaaaa').label).toBe('Fair')
    expect(getPasswordStrength('Password1').label).toBe('Good')
    expect(getPasswordStrength('Password1!').label).toBe('Strong')
  })
})

describe('validatePassword', () => {
  it('returns invalid for empty password', () => {
    const result = validatePassword('')
    expect(result.valid).toBe(false)
    expect(result.message).toBe('Password is required.')
  })

  it('returns invalid when too short', () => {
    const result = validatePassword('Ab1!')
    expect(result.valid).toBe(false)
    expect(result.message).toBe('Password must be at least 8 characters.')
  })

  it('returns invalid when missing uppercase', () => {
    const result = validatePassword('password1!')
    expect(result.valid).toBe(false)
    expect(result.message).toBe('Password must include at least one uppercase letter.')
  })

  it('returns invalid when missing lowercase', () => {
    const result = validatePassword('PASSWORD1!')
    expect(result.valid).toBe(false)
    expect(result.message).toBe('Password must include at least one lowercase letter.')
  })

  it('returns invalid when missing number', () => {
    const result = validatePassword('Password!')
    expect(result.valid).toBe(false)
    expect(result.message).toBe('Password must include at least one number.')
  })

  it('returns invalid when missing special character', () => {
    const result = validatePassword('Password1')
    expect(result.valid).toBe(false)
    expect(result.message).toBe('Password must include at least one special character (!@#$%^&* etc.).')
  })

  it('returns valid when all criteria met', () => {
    const result = validatePassword('Password1!')
    expect(result.valid).toBe(true)
    expect(result.message).toBeUndefined()
  })

  it('returns valid for edge case with minimal valid password', () => {
    const result = validatePassword('Abcdef1!')
    expect(result.valid).toBe(true)
  })
})
